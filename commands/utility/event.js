const SlashCommandBuilder = require("discord.js")

export default {
    data: new SlashCommandBuilder()
        .setName('event')
        .setDescription('Schedule an event!'),
    
    async execute(interaction) {
        await interaction.reply('Helloworld!');
    }
}