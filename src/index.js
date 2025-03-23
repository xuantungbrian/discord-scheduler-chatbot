import { Client, GatewayIntentBits, Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, TeamMemberMembershipState, GuildScheduledEventPrivacyLevel } from 'discord.js';
import { config } from 'dotenv';

import { timeSlots, daysOfWeek, normalTimeSlots, normalDaysOfWeek } from './data/constants.js'
import { calculateEventTime, createEvent } from './utils/utils.js';
import { get_winner, process_availability } from './utils/schedule.js';
import { s_handler } from './handlers/message/s.js';

config(); // Load environment variables from .env

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Store user availability for each time slot
let availability = {};
let usersSubmitted = new Set(); // Track users who have clicked submit
let rows = [];
let allUsers;

client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    // Get the first guild the bot is a part of
    const guild = client.guilds.cache.first();
    
    if (!guild) {
      console.log('Bot is not part of any guild.');
      return;
    }

    console.log(`Bot is in the guild: ${guild.name} (ID: ${guild.id})`);

    allUsers = await guild.members.fetch(); // Fetch all members in the guild
    
    // Initialize availability for non-bot users
    allUsers.forEach((member) => {
      if (!member.user.bot) { // Ensure we're only adding non-bot users
        availability[member.user.username] = [new Set(), new Set(), new Set(), new Set(), new Set()];
      }
    });
  } catch (error) {
    console.error('Error fetching members:', error);
  }
})
    
// Add buttons for days of the week
let currentRow = new ActionRowBuilder();
daysOfWeek.forEach((day, index) => {
  currentRow.addComponents(
    new ButtonBuilder()
      .setCustomId(`available_day_${index}`)
      .setLabel(day)
      .setStyle(ButtonStyle.Primary)
  );
});
rows.push(currentRow);

// Add buttons for time slots
timeSlots.forEach((timeSlot, index) => {
  const timeRow = new ActionRowBuilder();
  for (let i = 0; i < 5; i++) {
    let timeSlotWithPadding = timeSlot
    if (i == 1) {
      timeSlotWithPadding += "᲼"
    }
    timeRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`available_${index}_${i}`)
        .setLabel(timeSlotWithPadding)
        .setStyle(ButtonStyle.Secondary)
    );
  }
  rows.push(timeRow);
});

const submitRow = new ActionRowBuilder();
submitRow.addComponents(
  new ButtonBuilder()
    .setCustomId(`submit`)
    .setLabel("𝑆𝑈𝐵𝑀𝐼𝑇")
    .setStyle(ButtonStyle.Secondary)
);
rows.push(submitRow)

// !s
client.on('messageCreate', async (message) => await s_handler(message));

// interaction_start
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId !== 'start') return;
  
  await interaction.reply({
    content: "Select your available time slots:",
    components: rows,
    ephemeral: true, // Make the response ephemeral
  });
});

// interaction_available
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  if (!interaction.customId.includes('available_')) return;
  const user = interaction.user;

  const chosenTimeIndex = parseInt(interaction.customId.split('_')[1])
  const chosenDayIndex = parseInt(interaction.customId.split('_')[2])
  availability[user.username][chosenDayIndex].add(chosenTimeIndex);
  
  const rowsCopy = JSON.parse(JSON.stringify(rows))
  for (let x = 0; x < daysOfWeek.length; x++) { 
    availability[user.username][x].forEach((_, y) => {
      let chosenTime = timeSlots[y];
      if (x == 1) {
        chosenTime += "᲼"
      }

      rowsCopy[y + 1].components[x] = new ButtonBuilder()
        .setCustomId(`available_${y}_${x}`)
        .setLabel(chosenTime)
        .setStyle(ButtonStyle.Success);
    })
  }
  
  // Edit the message with the updated button rows
  await interaction.update({
    components: rowsCopy,
    ephemeral: true,
  });
});

// interaction_submit
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  if (!interaction.customId !== 'submit') return;
  const user = interaction.user;

  usersSubmitted.add(user.username); // Track user submission

  // Fetch all members of the guild (excluding bots)
  const totalUsers = allUsers.filter(member => !member.user.bot).size;

  if (usersSubmitted.size === totalUsers) {
    await interaction.reply({ 
      content: `✅ Thank you for submitting, ${user.username}!`, 
      ephemeral: true 
    });

    // Map time slots to number of people available
    // Count how many users are available at each time slot across all days
    // Sort time slots by highest availability count
    let sortedTimes = process_availability(daysOfWeek, timeSlots, availability)

    // Exit early if no time slot found
    if (sortedTimes.length <= 0) {
      await interaction.channel.send("❌ No common time slots found. Please try again later.");
      
      // Reset data
      allUsers.forEach((member) => {
        availability[member.user.username] = [new Set(), new Set(), new Set(), new Set(), new Set()];
      })
      usersSubmitted.clear();
      return;
    }
      
    let maxCount = sortedTimes[0][1]; // Get the highest availability count
    let bestTimes = sortedTimes
      .filter(([_, count]) => count === maxCount)
      .slice(0, 3)

    const pollDuration = 10000; // 2 minutes poll duration
    const pollEmojis = ["1️⃣", "2️⃣", "3️⃣"];
    const pollResults = {};

    // Inside the final time selection logic, replace the initiator message part:
    let pollMessageContent = "**Vote for the final meeting time!**\nReact with the corresponding emoji:\n";
    bestTimes.forEach(([key, count], i) => {
      let [dayIndex, timeIndex] = key.split('-').map(Number);
      let label = `${pollEmojis[i]} - ${normalDaysOfWeek[dayIndex]} ${normalTimeSlots[timeIndex]}`;
      pollResults[pollEmojis[i]] = { dayIndex, timeIndex, votes: 0 };
      pollMessageContent += `${label}\n`;
    });

    let pollMessage = await interaction.channel.send(pollMessageContent);
    
    for (let i = 0; i < sortedTimes.length; i++) {
      await pollMessage.react(pollEmojis[i]);
    }

    setTimeout(async () => {
      let bestOption = await get_winner(interaction, sortedTimes, pollMessage, pollEmojis, pollResults);
      let finalTime = `${normalDaysOfWeek[bestOption.dayIndex]} ${normalTimeSlots[bestOption.timeIndex]}`;
    
      await interaction.channel.send(`🏆 **The final meeting time is set for:** ${finalTime}`)

      // Create the event (example: Discord Event creation)
      const eventTime = calculateEventTime(bestOption.dayIndex, normalTimeSlots[bestOption.timeIndex]);
      let voiceChannel = await interaction.guild.channels.fetch();
      voiceChannel = voiceChannel.find(channel => channel.type === 2);

      // Create Event
      try {
        await createEvent(interaction, `Meeting: ${finalTime}`, eventTime)
        await interaction.channel.send(`🗓️ **Event created!** The meeting is scheduled for ${finalTime}`);
      } catch (error) {
        console.error('Error creating event:', error);
        await interaction.channel.send('❌ **Failed to create event.** Please try again.');
      }

    }, pollDuration);

    // Reset data
    allUsers.forEach((member) => {
      availability[member.user.username] = [new Set(), new Set(), new Set(), new Set(), new Set()];
    })
    usersSubmitted.clear();
  } else {
    await interaction.reply({ 
      content: `✅ Thank you for submitting, ${user.username}! Waiting for others... (${usersSubmitted.size}/${totalUsers})`, 
      ephemeral: true 
    });
  }
});

client.login(process.env.TOKEN);
