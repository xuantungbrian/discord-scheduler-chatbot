const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require("discord.js");
const { potentialEvents } = require('../../datastore/data.js')

const userAvailabilities = new Map(); // Stores user selections

module.exports = {
    data: new SlashCommandBuilder()
        .setName("checkin")
        .setDescription("Check in for an event and choose your available time slots."),

    execute : (interaction) => {
        interaction.reply("hello")
        // const userId = interaction.user.id;
        // if (potentialEvents.size === 0) {
        //     return interaction.reply("❌ There are no ongoing events to check in for.");
        // }

        // // Step 1: Let the user select an event
        // const eventOptions = Array.from(potentialEvents.entries()).map(([messageId, event]) => ({
        //     label: event.name,
        //     value: messageId
        // }));

        // const eventSelectMenu = new StringSelectMenuBuilder()
        //     .setCustomId("event_selection")
        //     .setPlaceholder("Select an event")
        //     .addOptions(eventOptions);

        // await interaction.reply({
        //     content: "📅 **Select an event to check in for:**",
        //     components: [new ActionRowBuilder().addComponents(eventSelectMenu)],
        //     ephemeral: true
        // });

        // // Step 2: Handle event selection
        // const filter = (i) => i.user.id === userId;
        // const selection = await interaction.channel.awaitMessageComponent({ filter, time: 60000 }).catch(() => null);

        // if (!selection) return interaction.followUp("❌ You didn't select an event in time.");

        // const eventId = selection.values[0];
        // const event = potentialEvents.get(eventId);

        // // Step 3: Let user pick available time slots
        // await handleTimeSelection(interaction, event, userId);
    }
};

async function handleTimeSelection(interaction, event, userId) {
    const validHours = Array.from({ length: 24 }, (_, i) => i); // 0 - 23 hours
    const timeSelections = userAvailabilities.get(userId) || {};

    for (const day of event.days) {
        timeSelections[day] = timeSelections[day] || new Set();
    }

    // Step 4: Create buttons for each day/time slot
    const rows = [];
    for (const day of event.days) {
        const buttons = validHours.map((hour) => 
            new ButtonBuilder()
                .setCustomId(`${day}-${hour}`)
                .setLabel(`${day.slice(0, 3)} ${hour}:00`)
                .setStyle(ButtonStyle.Secondary)
        );

        // Chunk buttons into rows of 5
        for (let i = 0; i < buttons.length; i += 5) {
            rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
        }
    }

    const reply = await interaction.followUp({
        content: `⏳ **Select your available time slots for**: **${event.name}**\n(Click a time to toggle selection)`,
        components: rows,
        ephemeral: true
    });

    // Step 5: Handle button clicks
    const filter = (i) => i.user.id === userId;
    const collector = reply.createMessageComponentCollector({ filter, time: 60000 });

    collector.on("collect", async (i) => {
        const [day, hour] = i.customId.split("-");
        const hourInt = parseInt(hour);

        if (timeSelections[day].has(hourInt)) {
            timeSelections[day].delete(hourInt);
        } else {
            timeSelections[day].add(hourInt);
        }

        userAvailabilities.set(userId, timeSelections);

        await i.deferUpdate(); // Acknowledge the button press
    });

    collector.on("end", () => {
        interaction.followUp("✅ Time selection saved!");
    });
}
