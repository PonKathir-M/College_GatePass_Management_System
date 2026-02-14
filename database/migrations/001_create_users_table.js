module.exports = {
  up: async (q, S) => {
    await q.createTable("Users", {
      user_id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
      name: S.STRING,
      email: { type: S.STRING, unique: true },
      password: S.STRING,
      role: S.STRING,
      active: { type: S.BOOLEAN, defaultValue: true },
      createdAt: S.DATE,
      updatedAt: S.DATE
    });
  },
  down: async (q) => q.dropTable("Users")
};
