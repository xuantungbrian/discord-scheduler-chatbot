import { Client, GatewayIntentBits, Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, TeamMemberMembershipState } from 'discord.js';
import { config } from 'dotenv';

config(); // Load environment variables from .env

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
});

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

// Store user availability for each time slot
let availability = {};
let usersSubmitted = new Set(); // Track users who have clicked submit
let rows = [];
    
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

client.on('messageCreate', async (message) => {
  if (message.content === '!s') {
    // Send the message with the grid of buttons
    await message.reply({
      content: "Select your available time slots:",
      components: rows,
    });
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  const user = interaction.user;
  
  // // Mark the time slot for the user
  // if (!availability[user.username]) {
  //   availability[user.username] = [];
  // }

  // // Add the user to the time slot
  // if (!availability[user.username].includes(timeSlot)) {
  //   availability[user.username].push(timeSlot);
  // }

  // Modify the button color for the user who clicked it
  if (interaction.customId.includes('available_')) {
    const chosenTimeIndex = parseInt(interaction.customId.split('_')[1])
    const chosenDayIndex = parseInt(interaction.customId.split('_')[2])
    let chosenTime = timeSlots[chosenTimeIndex];
    const chosenDay = daysOfWeek[chosenDayIndex];
    if (chosenDayIndex == 1) {
      chosenTime += "᲼"
    }

    rows[chosenTimeIndex+1].components[chosenDayIndex] = new ButtonBuilder()
      .setCustomId(interaction.customId)  // Retain the same customId
      .setLabel(chosenTime)  // Optional: change the label
      .setStyle(ButtonStyle.Success);
    
    // TODO: Might need to make a copy of rows instead of doing this since it might also updated for other users

    // Edit the message with the updated button rows
    await interaction.update({
      content: `You selected: ${chosenTime} on ${chosenDay}`,
      components: rows,
      ephemeral: true, //TODO: Not sure if need this
    });
  }

  // Check if the user clicked the 'Submit' button
  if (interaction.customId === 'submit') {
    usersSubmitted.add(user.username); // Track user submission

    // Check if all users have submitted
    const allUsers = await interaction.guild.members.fetch(); // Fetch all members in the guild
    const totalUsers = allUsers.filter(member => !member.user.bot).size; // Count non-bot users

    if (usersSubmitted.size === totalUsers) {
      // All users have submitted, now calculate the best time slots
      let availableTimes = [];

      // Iterate over all time slots and find common availability
      timeSlots.forEach((timeSlot) => {
        let availableCount = 0;
        for (let user in availability) {
          if (availability[user].includes(timeSlot)) {
            availableCount++;
          }
        }
        if (availableCount === totalUsers) {
          availableTimes.push(timeSlot); // Add to the list if all users are available at this time
        }
      });

      // Send out the best available times
      if (availableTimes.length > 0) {
        await interaction.channel.send(`The best times for everyone to meet are: ${availableTimes.join(', ')}`);
      } else {
        await interaction.channel.send("No common time slots found. Please try again later.");
      }

      // Reset after calculating
      availability = {}; // Clear availability data
      usersSubmitted.clear(); // Reset submitted users
    } else {
      await interaction.reply({ content: `Thank you for submitting, ${user.username}! Waiting for others to submit...`, ephemeral: true });
    }
  }
});


// Command to display the availability grid
client.on('messageCreate', async (message) => {
  if (message.content === '!showSchedule') {
    let schedule = 'Availability Schedule:\n';

    timeSlots.forEach((timeSlot) => {
      schedule += `${timeSlot}: ${availability[timeSlot] ? availability[timeSlot].join(', ') : 'No one'}\n`;
    });

    await message.reply(schedule);
  }
});

client.login(process.env.TOKEN);
