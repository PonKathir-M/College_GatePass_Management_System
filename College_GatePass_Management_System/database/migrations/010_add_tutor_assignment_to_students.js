module.exports = {
  up: async (q, S) => {
    // Add tutor assignment field to students table
    await q.addColumn("Students", "AssignedStaffStaffId", {
      type: S.INTEGER,
      allowNull: true,
      references: {
        model: "Staffs",
        key: "staff_id"
      }
    });
  },
  down: async (q) => {
    await q.removeColumn("Students", "AssignedStaffStaffId");
  }
};
