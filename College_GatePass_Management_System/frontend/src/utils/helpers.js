export const isMorning = () => {
  const h = new Date().getHours();
  return h < 9;
};
