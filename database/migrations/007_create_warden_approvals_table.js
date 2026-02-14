module.exports = {
  up: async (q, S) => {
    await q.createTable("WardenApprovals", {
      id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
      approved: S.BOOLEAN,
      reason: S.STRING,
      GatePassGatepassId: S.STRING,
      createdAt: S.DATE,
      updatedAt: S.DATE
    });
  },
  down: async (q) => q.dropTable("WardenApprovals")
};
