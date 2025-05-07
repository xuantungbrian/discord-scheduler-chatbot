import { GuildScheduledEventPrivacyLevel } from "discord.js";

export const calculateEventTime = (targetDayIndex, timeString) => {
  // Parse the time string (handle 12-hour format)
  let [hour, minute, period] = timeString.split(":");
  minute = minute.split(" ")[0]; // Remove the "AM/PM" part if present
  hour = parseInt(hour, 10);

  if (period && period.toUpperCase() === "PM" && hour !== 12) {
    hour += 12; // Convert PM to 24-hour format
  } else if (period && period.toUpperCase() === "AM" && hour === 12) {
    hour = 0; // Convert 12 AM to 00:00 hours
  }

  // Get the current date
  const currentDate = new Date();
  let eventDate = new Date(currentDate);

  // Set the current time to 00:00 to focus on the day first
  eventDate.setHours(0, 0, 0, 0);

  // Calculate the difference in days to the target day
  let diffDays = targetDayIndex - eventDate.getDay();
  if (diffDays <= 0) {
    diffDays += 7 + 1; // If the target day has already passed this week, set it to next week
  }

  // Adjust the event date to the target day of the week
  eventDate.setDate(eventDate.getDate() + diffDays);

  // Set the event time (using the parsed hour and minute)
  eventDate.setHours(hour, minute, 0, 0);

  // If the calculated time has already passed, set it for the next week
  if (eventDate < new Date()) {
    eventDate.setDate(eventDate.getDate() + 7);
  }

  return eventDate;
}

export const createEvent = async (interaction, name, eventTime) => {
  await interaction.guild.scheduledEvents.create({
    name: name,
    description: 'Scheduled meeting',
    scheduledStartTime: eventTime,
    scheduledEndTime: new Date(eventTime.getTime() + 60 * 60 * 1000), // 1-hour duration
    entityType: 3,
    privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
    entityMetadata: {
      location: "Online",
    },
  });
}
