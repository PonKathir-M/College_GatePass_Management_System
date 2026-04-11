const normalizeCategory = (value) =>
  (value || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

const isHosteller = (value) => normalizeCategory(value) === "hosteller";

const isDayScholar = (value) => {
  const normalized = normalizeCategory(value);
  return normalized === "dayscholar" || normalized === "dayscholer";
};

const toStoredCategory = (value) => {
  if (isHosteller(value)) return "hosteller";
  if (isDayScholar(value)) return "day-scholar";
  return (value || "").toString().trim().toLowerCase();
};

module.exports = {
  normalizeCategory,
  isHosteller,
  isDayScholar,
  toStoredCategory
};
