import { Client, GatewayIntentBits, Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, TeamMemberMembershipState } from 'discord.js';
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
let commandInitiator = null;

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
    commandInitiator = message.author.username;
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
        .filter(([_, count]) => count > 0) // Ignore empty slots
        .slice(0, 3); // Take top 3 slots

      if (sortedTimes.length > 0) {
        // let maxCount = sortedTimes[0][1]; // Get the highest availability count

        let bestTimeButtons = sortedTimes.map(([key, count]) => {
          let [dayIndex, timeIndex] = key.split('-').map(Number);
          let label = `${daysOfWeek[dayIndex]} ${timeSlots[timeIndex]} (${count} available)`;
          return new ButtonBuilder()
            .setCustomId(`finalchoice_${dayIndex}_${timeIndex}`)
            .setLabel(label)
            .setStyle(ButtonStyle.Primary);
        });

        let bestTimeRow = new ActionRowBuilder().addComponents(bestTimeButtons);

        let initiator = allUsers.find(member => member.user.username === commandInitiator);
        if (initiator) {
          await initiator.send({
            content: "📅 **Please choose the final meeting time:**",
            components: [bestTimeRow],
          });
        } else {
          await interaction.channel.send("❌ The original initiator is not found.");
        }

        allUsers.forEach((member) => {
          availability[member.user.username] = [new Set(), new Set(), new Set(), new Set(), new Set()];
        });
        usersSubmitted.clear();
      } else {
        await interaction.channel.send("❌ No common time slots found. Please try again later.");
      }
    } else {
      await interaction.reply({ 
        content: `✅ Thank you for submitting, ${user.username}! Waiting for others... (${usersSubmitted.size}/${totalUsers})`, 
        ephemeral: true 
      });
    }
  }

  // Handle final selection
  if (interaction.customId.startsWith('finalchoice_')) {
    if (user.username !== commandInitiator) {
      return interaction.reply({
        content: "❌ Only the original initiator can select the final time.",
        ephemeral: true,
      });
    }

    const weekdays = [
      "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"
    ]

    const [_, dayIndex, timeIndex] = interaction.customId.split('_').map(Number);
    let finalTime = `${weekdays[dayIndex]} ${timeSlots[timeIndex]}`;

    await interaction.channel.send(`✅ **The final meeting time is set for:** ${finalTime}`);
  }
});

const createDiscordEvent = async (guild, eventTime) => {
  const startTime = new Date(); // Replace this with actual parsed time from eventTime
  startTime.setMinutes(0, 0, 0); // Example: Round to the nearest hour

  const endTime = new Date(startTime);
  endTime.setHours(startTime.getHours() + 1); // 1-hour event duration (adjust as needed)

  try {
      const event = await guild.scheduledEvents.create({
          name: `📅 Community Event - ${eventTime}`,
          scheduledStartTime: startTime.toISOString(),
          scheduledEndTime: endTime.toISOString(),
          privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
          entityType: GuildScheduledEventEntityType.Voice,
          description: `An event scheduled at ${eventTime}. Be sure to join!`,
          channel: guild.channels.cache.find(c => c.type === 2), // Select a voice channel
      });

      guild.systemChannel.send(`📢 **New Event Created!**\n📅 **${event.name}**\n🕒 **Time:** ${eventTime}\n🔗 [Join Event](${event.url})`);
  } catch (error) {
      console.error('Error creating event:', error);
  }
};

client.login(process.env.TOKEN);
