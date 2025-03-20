const { SlashCommandBuilder } = require("discord.js")

const scheduledEvents = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('event')
        .setDescription('Schedule an event!'),
    
    async execute(interaction) {
        const currChannel = interaction.channel;
        const currUser = interaction.user;
        try {
            // Start event setup
            await interaction.reply("Starting event setup... Type `cancel` anytime to stop.\n" + 
                                    "What is the event name?");
            
            console.log(1)
            // Event name prompt
            const eventNameResponse = await currChannel.awaitMessages({ 
                filter: (msg) => msg.author.id == currUser.id, 
                max: 1, 
                time: 30000, 
                errors: ["time"] 
            })
            .catch(() => null);

            const eventName = eventNameResponse ? eventNameResponse.first().content : null;
            if (!eventName) return interaction.followUp("Event setup cancelled.");

            // Event length prompt
            await interaction.followUp("How many hours will the event last? Please respond with an integer between 1-24.");
            const eventLengthResponse = await currChannel.awaitMessages({ 
                filter: (msg) => msg.author.id === currUser.id, 
                max: 1, 
                time: 30000, 
                errors: ["time"] 
            }).catch(() => null);

            const eventLength = eventLengthResponse ? parseInt(eventLengthResponse.first().content) : null;
            if (isNaN(eventLength) || eventLength <= 0 || eventLength > 24) return interaction.followUp("Event setup cancelled.");

            // Event day prompt
            await interaction.followUp("What days of the week could the event be on? \n" + 
                                       "Enter one day for a specific day of week (`friday`), \n" + 
                                       "or multiple options like so: `monday, tuesday, friday`");

            const eventDayResponse = await currChannel.awaitMessages({ 
                filter: (msg) => msg.author.id === currUser.id, 
                max: 1, 
                time: 30000, 
                errors: ["time"] 
            }).catch(() => null);

            const validDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
            const eventDays = eventDayResponse 
                ? eventDayResponse.first().content
                    .toLowerCase()
                    .split(",") // Split by commas
                    .map(day => day.trim()) // Trim spaces
                    .filter(day => validDays.includes(day)) // Keep only valid days
                : [];

            if (eventDays.length === 0) return interaction.followUp("Event setup cancelled. No valid days provided.");

            // Confirm selection
            await interaction.followUp(`You have selected: ${eventDays.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(", ")}`);

            // Create event invite
            await interaction.followUp(`Creating event...`);
            const eventMessage = await interaction.followUp(
                `📅 **Let's check our schedules!** 📅\n\n` +
                `**Event:** ${eventName}\n` +
                `**Duration:** ${eventLength} hours\n` +
                `**Potential days:** ${eventDays.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(", ")}\n` + 
                `@everyone React below to confirm your interest:\n✅ - Interested\n❌ - Not Interested`
            );

            // Add reactions for user response
            await eventMessage.react("✅");
            await eventMessage.react("❌");

        } catch (err) {
            console.error(err);
        }
    }
}