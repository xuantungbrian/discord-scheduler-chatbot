let availability = {};
let usersSubmitted = new Set(); // Track users who have clicked submit

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

export default {
    availability, 
    usersSubmitted,
    timeSlots,
    daysOfWeek
}