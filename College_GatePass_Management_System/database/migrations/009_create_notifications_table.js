module.exports = {
  up: async (q, S) => {
    await q.createTable("Notifications", {
      notification_id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
      UserUserId: S.INTEGER,
      sender: S.STRING,
      message: S.STRING,
      type: S.STRING,
      reference_id: S.STRING,
      createdAt: S.DATE,
      updatedAt: S.DATE
    });
  },
  down: async (q) => q.dropTable("Notifications")
};
