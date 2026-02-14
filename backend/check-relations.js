const { User, Department, Staff, Student } = require('./src/models');
const sequelize = require('./src/config/database');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');
    
    // Check Arun's staff record
    const arunUser = await User.findOne({ 
      where: { email: 'Arun@gmail.com' },
      include: { model: Staff, as: 'Staff', include: { model: Department } }
    });
    
    console.log('👨‍🏫 Arun Details:');
    console.log('  Email:', arunUser.email);
    console.log('  Role:', arunUser.role);
    console.log('  Staff Record:', arunUser.Staff ? 'EXISTS' : 'MISSING');
    if (arunUser.Staff) {
      console.log('  Department:', arunUser.Staff.Department?.department_name || 'NOT LINKED');
    }
    
    // Check departments
    const depts = await Department.findAll();
    console.log('\n🏢 Departments:', depts.length);
    if (depts.length === 0) {
      console.log('  ⚠️  No departments found!');
    }
    
    // Check Subi
    const subiUser = await User.findOne({
      where: { email: 'subi@gmail.com' },
      include: { model: Student, as: 'Student', include: { model: Department } }
    });
    
    console.log('\n👨‍🎓 Subi Details:');
    console.log('  Email:', subiUser.email);
    console.log('  Role:', subiUser.role);
    console.log('  Student Record:', subiUser.Student ? 'EXISTS' : 'MISSING');
    if (subiUser.Student) {
      console.log('  Department:', subiUser.Student.Department?.department_name || 'NOT LINKED');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
