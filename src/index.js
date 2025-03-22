import { Client, GatewayIntentBits, Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, TeamMemberMembershipState, GuildScheduledEventPrivacyLevel } from 'discord.js';
import { config } from 'dotenv';

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

const timeSlots = [
  "𝟶𝟿꞉𝟶𝟶᲼𝙰𝙼᲼᲼",
  "𝟷𝟶꞉𝟶𝟶᲼𝙰𝙼᲼᲼",
  "𝟷𝟷꞉𝟶𝟶᲼𝙰𝙼᲼᲼",
];

const daysOfWeek = [
  "𝙼𝚘𝚗𝚍𝚊𝚢᲼᲼᲼᲼",
  "𝚃𝚞𝚎𝚜𝚍𝚊𝚢᲼᲼᲼",
  "𝚆𝚎𝚍𝚗𝚎𝚜𝚍𝚊𝚢",
  "𝚃𝚑𝚞𝚛𝚜𝚍𝚊𝚢᲼",
  "𝙵𝚛𝚒𝚍𝚊𝚢᲼᲼᲼"
];

const normalTimeSlots = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
]

const normalDaysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
]
    
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

let allUsers

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

// Create a 'Join' button to trigger the grid
const joinButtonRow = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId('start')
    .setLabel('Pick Availability')
    .setStyle(ButtonStyle.Primary)
);

client.on('messageCreate', async (message) => {
  if (message.content === '!s') {
    // Send the 'Join' button to the user
    await message.reply({
      content: "Click to select your available time slots:",
      components: [joinButtonRow],
    });
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  const user = interaction.user;

  // If the user clicked the 'Pick Availability' button
  if (interaction.customId === 'start') {
    // Send the grid with time slots and make it ephemeral
    await interaction.reply({
      content: "Select your available time slots:",
      components: rows,
      ephemeral: true, // Make the response ephemeral
    });
  }

  // Modify the button color for the user who clicked it
  if (interaction.customId.includes('available_')) {
    const chosenTimeIndex = parseInt(interaction.customId.split('_')[1])
    const chosenDayIndex = parseInt(interaction.customId.split('_')[2])
    availability[user.username][chosenDayIndex].add(chosenTimeIndex);
    
    const rowsCopy = JSON.parse(JSON.stringify(rows));
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
  }

  // Check if the user clicked the 'Submit' button
  if (interaction.customId === 'submit') {
    usersSubmitted.add(user.username); // Track user submission

    // Fetch all members of the guild (excluding bots)
    const totalUsers = allUsers.filter(member => !member.user.bot).size;

    // If all users have submitted, process availability
    if (usersSubmitted.size === totalUsers) {
      await interaction.reply({ 
        content: `✅ Thank you for submitting, ${user.username}!`, 
        ephemeral: true 
      });

      let timeScores = {}; // Map time slots to number of people available

      // Count how many users are available at each time slot across all days
      daysOfWeek.forEach((_, dayIndex) => {
        timeSlots.forEach((timeSlot, timeIndex) => {
          const key = `${dayIndex}-${timeIndex}`;
          timeScores[key] = 0;
          
          for (let user in availability) {
            if (availability[user][dayIndex].has(timeIndex)) {
              timeScores[key]++;
            }
          }
        });
      });

      // Sort time slots by highest availability count
      let sortedTimes = Object.entries(timeScores)
        .sort((a, b) => b[1] - a[1]) // Descending order of people available
        .filter(([_, count]) => count > 0); // Ignore empty slots

      if (sortedTimes.length > 0) {
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
          // Fetch reactions and count votes
          let fetchedMessage = await interaction.channel.messages.fetch(pollMessage.id);
          
          // Loop through each emoji and count only user reactions
          for (let i = 0; i < sortedTimes.length; i++) {
            let emoji = pollEmojis[i];
            let reaction = fetchedMessage.reactions.cache.get(emoji);
            
            if (reaction) {
              await reaction.users.fetch();
              // Filter out the bot's reaction (assuming the bot has reacted)
              let userReactions = reaction.users.cache.filter(user => user.id !== interaction.client.user.id);
              
              // Count only the users' reactions
              pollResults[emoji].votes = userReactions.size;
            }
          }
        
          // Determine the winner
          let bestOption = Object.entries(pollResults)
            .sort((a, b) => b[1].votes - a[1].votes)[0][1];
        
          let finalTime = `${normalDaysOfWeek[bestOption.dayIndex]} ${normalTimeSlots[bestOption.timeIndex]}`;
        
          await interaction.channel.send(`🏆 **The final meeting time is set for:** ${finalTime}`)

          // Create the event (example: Discord Event creation)
          const eventTime = calculateEventTime(bestOption.dayIndex, normalTimeSlots[bestOption.timeIndex]);
          let voiceChannel = await interaction.guild.channels.fetch();
          voiceChannel = voiceChannel.find(channel => channel.type === 2);
          try {
            // Creating an event (Discord Event Example)
            await interaction.guild.scheduledEvents.create({
              name: `Meeting: ${finalTime}`,
              description: 'Scheduled meeting',
              scheduledStartTime: eventTime,
              scheduledEndTime: new Date(eventTime.getTime() + 60 * 60 * 1000), // 1-hour duration
              entityType: 3,
              privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
              entityMetadata: {
                location: "Online",
              },
            });
            await interaction.channel.send(`🗓️ **Event created!** The meeting is scheduled for ${finalTime}`);
          } catch (error) {
            console.error('Error creating event:', error);
            await interaction.channel.send('❌ **Failed to create event.** Please try again.');
          }
        }, pollDuration);
      } else {
        await interaction.channel.send("❌ No common time slots found. Please try again later.");
      }

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
  }
});

function calculateEventTime(targetDayIndex, timeString) {
  // Parse the time string (handle 12-hour format)
  let [hour, minute, period] = timeString.split(':');
  minute = minute.split(' ')[0]; // Remove the "AM/PM" part if present
  hour = parseInt(hour, 10);

  if (period && (period.toUpperCase() === 'PM' && hour !== 12)) {
    hour += 12; // Convert PM to 24-hour format
  } else if (period && (period.toUpperCase() === 'AM' && hour === 12)) {
    hour = 0; // Convert 12 AM to 00:00 hours
  }

  // Get the current date
  const currentDate = new Date();
  let eventDate = new Date(currentDate);

  // Set the current time to 00:00 to focus on the day first
  eventDate.setHours(0, 0, 0, 0);

  // Calculate the difference in days to the target day
  let diffDays = targetDayIndex - eventDate.getDay();
  if (diffDays <= 0) {
    diffDays += 7 + 1; // If the target day has already passed this week, set it to next week
  }

  // Adjust the event date to the target day of the week
  eventDate.setDate(eventDate.getDate() + diffDays);

  // Set the event time (using the parsed hour and minute)
  eventDate.setHours(hour, minute, 0, 0);

  // If the calculated time has already passed, set it for the next week
  if (eventDate < new Date()) {
    eventDate.setDate(eventDate.getDate() + 7);
  }

  return eventDate;
}

client.login(process.env.TOKEN);
