module.exports = {
  up: async (q, S) => {
    await q.createTable("GatePasses", {
      gatepass_id: { type: S.STRING, primaryKey: true },
      reason: S.STRING,
      out_time: S.TIME,
      expected_return: S.TIME,
      StudentStudentId: S.INTEGER,
      status: S.STRING,
      rejection_reason: S.STRING,
      createdAt: S.DATE,
      updatedAt: S.DATE
    });
  },
  down: async (q) => q.dropTable("GatePasses")
};
