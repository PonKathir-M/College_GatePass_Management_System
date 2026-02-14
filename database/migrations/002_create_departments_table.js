module.exports = {
  up: async (q, S) => {
    await q.createTable("Departments", {
      department_id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
      department_name: S.STRING,
      createdAt: S.DATE,
      updatedAt: S.DATE
    });
  },
  down: async (q) => q.dropTable("Departments")
};
