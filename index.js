import { Client, GatewayIntentBits, Events, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { config } from 'dotenv';

config(); // Load environment variables from .env

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const timeSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
];

// Store user availability for each time slot (use a map or an object)
let availability = {};

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Start the scheduler command
client.on('messageCreate', async (message) => {
  if (message.content === '!s') {
    let rows = [];

    // Define your time slots
    const timeSlots = [
      "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM",
      "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
    ];

    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    // Add buttons for days of the week
    let currentRow = new ActionRowBuilder();
    daysOfWeek.forEach((day, index) => {
      currentRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`available_day_${index}`)
          .setLabel(day)
          .setStyle(ButtonStyle.Primary)
      );

      // If there are 5 buttons, push the current row and start a new row
      if (currentRow.components.length === 5) {
        rows.push(currentRow);
        currentRow = new ActionRowBuilder(); // Create a new row
      }
    });

    // Push the remaining row if it has any buttons
    if (currentRow.components.length > 0) {
      rows.push(currentRow);
    }

    // Add buttons for time slots
    currentRow = new ActionRowBuilder();
    timeSlots.forEach((timeSlot, index) => {
      currentRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`available_${index}`)
          .setLabel(timeSlot)
          .setStyle(ButtonStyle.Primary)
      );

      // If there are 5 buttons, push the current row and start a new row
      if (currentRow.components.length === 5) {
        rows.push(currentRow);
        currentRow = new ActionRowBuilder(); // Create a new row
      }
    });

    // Push the remaining row if it has any buttons
    if (currentRow.components.length > 0) {
      rows.push(currentRow);
    }

    // Send the message with the grid of buttons
    await message.reply({
      content: "Select your available time slots:",
      components: rows,
    });
  }
});

// Collect button responses and track availability
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const user = interaction.user;
  const timeSlotIndex = interaction.customId.split('_')[1];
  const timeSlot = timeSlots[timeSlotIndex];

  // Mark the time slot for the user
  if (!availability[timeSlot]) {
    availability[timeSlot] = [];
  }

  // Add the user to the time slot
  if (!availability[timeSlot].includes(user.username)) {
    availability[timeSlot].push(user.username);
    await interaction.reply({ content: `${user.username} is available at ${timeSlot}`, ephemeral: true });
  } else {
    await interaction.reply({ content: `${user.username}, you've already selected this time!`, ephemeral: true });
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
