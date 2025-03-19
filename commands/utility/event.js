const { SlashCommandBuilder } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('event')
        .setDescription('Schedule an event!'),
    
    async execute(interaction) {
        await interaction.reply('Helloworld!');
    }
}