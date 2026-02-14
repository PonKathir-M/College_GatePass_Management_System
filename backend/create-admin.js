const { User } = require('./src/models');
const sequelize = require('./src/config/database');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');
    
    // Delete all users
    await User.destroy({ where: {} });
    console.log('🗑️  Deleted all existing users');
    
    // Create new admin
    const adminHash = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: "Admin",
      email: "admin@gatepass.com",
      password: adminHash,
      role: "admin",
      active: true
    });
    
    console.log('\n✅ New admin user created:');
    console.log(`  📧 Email: admin@gatepass.com`);
    console.log(`  🔐 Password: admin123`);
    console.log(`  👤 Name: Admin`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
