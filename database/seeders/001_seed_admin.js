const bcrypt = require("bcryptjs");

module.exports = {
  up: async (q) => {
    const hash = await bcrypt.hash("admin123", 10);
    await q.bulkInsert("Users", [{
      name: "Admin",
      email: "admin@gatepass.com",
      password: hash,
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },
  down: async (q) => q.bulkDelete("Users", null, {})
};
