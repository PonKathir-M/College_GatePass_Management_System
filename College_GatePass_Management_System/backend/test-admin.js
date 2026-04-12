const { User } = require('./src/models');
const sequelize = require('./src/config/database');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');
    
    const users = await User.findAll();
    console.log('\n📋 All Users:');
    if (users.length === 0) {
      console.log('  (No users found)');
    } else {
      users.forEach(u => console.log(`  - ${u.email} (${u.role})`));
    }
    
    const admin = await User.findOne({ where: { role: 'admin' } });
    console.log('\n🔐 Admin User:', admin ? 'EXISTS' : 'NOT FOUND');
    if (admin) {
      console.log(`  Email: ${admin.email}`);
      console.log(`  Name: ${admin.name}`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
