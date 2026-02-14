module.exports = {
  up: async (q, S) => {
    await q.createTable("Staffs", {
      staff_id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
      role: S.STRING,
      UserUserId: S.INTEGER,
      DepartmentDepartmentId: S.INTEGER,
      createdAt: S.DATE,
      updatedAt: S.DATE
    });
  },
  down: async (q) => q.dropTable("Staffs")
};
