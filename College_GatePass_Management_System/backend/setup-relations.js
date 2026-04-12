const { User, Department, Staff, Student } = require('./src/models');
const sequelize = require('./src/config/database');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');
    
    // Get CSE Department
    const cseDept = await Department.findOne({
      where: { department_name: "Computer Science & Engineering" }
    });
    
    if (!cseDept) {
      console.error('❌ CSE Department not found!');
      process.exit(1);
    }
    
    // Get Arun user
    const arunUser = await User.findOne({ where: { email: 'Arun@gmail.com' } });
    
    // Create Staff record for Arun
    const arunStaff = await Staff.create({
      UserId: arunUser.user_id,
      DepartmentId: cseDept.department_id
    });
    console.log('✅ Created Staff record for Arun (CSE)');
    
    // Get Subi user  
    const subiUser = await User.findOne({ where: { email: 'subi@gmail.com' } });
    
    // Create Student record for Subi
    const subiStudent = await Student.create({
      UserId: subiUser.user_id,
      DepartmentId: cseDept.department_id,
      year: 1,
      parent_phone: "9876543210"
    });
    console.log('✅ Created Student record for Subi (CSE, Year 1)');
    
    console.log('\n✨ All relationships setup complete!');
    console.log('\n👨‍🏫 Staff Login:');
    console.log('   Email: Arun@gmail.com');
    console.log('   Password: (use your existing password)');
    console.log('\n👨‍🎓 Student Login:');
    console.log('   Email: subi@gmail.com');
    console.log('   Password: (use your existing password)');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
