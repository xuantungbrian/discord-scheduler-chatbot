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

const timeSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
];

// Store user availability for each time slot (use a map or an object)
let availability = {};

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.content === '!s') {
    let rows = [];
    
    // TODO: Add alignment later
    const timeSlots = [
      "𝟶𝟿꞉𝟶𝟶᲼𝙰𝙼᲼᲼",
      "𝟷𝟶꞉𝟶𝟶᲼𝙰𝙼᲼᲼",
      "𝟷𝟷꞉𝟶𝟶᲼𝙰𝙼᲼᲼",
      "𝟷𝟸꞉𝟶𝟶᲼𝙿𝙼᲼᲼"
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
