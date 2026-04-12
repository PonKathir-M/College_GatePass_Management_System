module.exports = {
  up: async (q) => {
    await q.bulkInsert("Departments", [
      { department_name: "CSE", createdAt: new Date(), updatedAt: new Date() },
      { department_name: "ECE", createdAt: new Date(), updatedAt: new Date() },
      { department_name: "MECH", createdAt: new Date(), updatedAt: new Date() }
    ]);
  },
  down: async (q) => q.bulkDelete("Departments", null, {})
};
