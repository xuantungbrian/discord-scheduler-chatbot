export const interaction_start = async (rows, interaction) => {
  await interaction.reply({
    content: "Select your available time slots:",
    components: rows,
    ephemeral: true, // Make the response ephemeral
  });
  return
};

export const process_availability = (daysOfWeek, timeSlots, availability) => {
  let timeScores = {}

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

  let sortedTimes = Object.entries(timeScores)
    .sort((a, b) => b[1] - a[1]) // Descending order of people available
    .filter(([_, count]) => count > 0); // Ignore empty slots

  return sortedTimes;
}

export const get_winner = async (interaction, sortedTimes, pollMessage, pollEmojis, pollResults) => {
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

  return bestOption
}