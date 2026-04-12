exports.isSunday = () => {
  return new Date().getDay() === 0;
};

exports.isHoliday = (date = new Date()) => {
  // Define national/college holidays (example)
  const holidays = [
    "01-26", // Republic Day
    "03-08", // Maha Shivaratri (approximate)
    "03-25", // Holi (approximate)
    "04-14", // Ambedkar Jayanti
    "05-23", // Buddha Purnima (approximate)
    "07-17", // Muharram (approximate)
    "08-15", // Independence Day
    "08-31", // Janmashtami (approximate)
    "09-16", // Milad un-Nabi (approximate)
    "10-02", // Gandhi Jayanti
    "10-12", // Dussehra (approximate)
    "10-31", // Diwali (approximate)
    "11-01", // Diwali holiday
    "12-25"  // Christmas
  ];

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${month}-${day}`;

  return holidays.includes(dateStr);
};

exports.currentHour = () => {
  return new Date().getHours();
};
