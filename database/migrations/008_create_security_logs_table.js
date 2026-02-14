module.exports = {
  up: async (q, S) => {
    await q.createTable("SecurityLogs", {
      log_id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
      actual_out: S.DATE,
      actual_in: S.DATE,
      GatePassGatepassId: S.STRING,
      createdAt: S.DATE,
      updatedAt: S.DATE
    });
  },
  down: async (q) => q.dropTable("SecurityLogs")
};
