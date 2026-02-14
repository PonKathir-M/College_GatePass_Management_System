module.exports = {
  up: async (q, S) => {
    await q.createTable("Students", {
      student_id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
      year: S.INTEGER,
      category: S.STRING,
      parent_phone: S.STRING,
      active: { type: S.BOOLEAN, defaultValue: true },
      UserUserId: S.INTEGER,
      DepartmentDepartmentId: S.INTEGER,
      createdAt: S.DATE,
      updatedAt: S.DATE
    });
  },
  down: async (q) => q.dropTable("Students")
};
