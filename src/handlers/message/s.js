import { ActionRowBuilder, ButtonBuilder } from "@discordjs/builders";
import { ButtonStyle } from "discord.js";

// Create a 'Join' button to trigger the grid
const joinButtonRow = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId('start')
    .setLabel('Pick Availability')
    .setStyle(ButtonStyle.Primary)
);

export const s_handler = async (message) => {
  if (message.content === '!s') {
    // Send the 'Join' button to the user
    await message.reply({
        content: "Click to select your available time slots:",
        components: [joinButtonRow],
    });
  }
}