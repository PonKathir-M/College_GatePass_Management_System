const { sequelize, User, Staff, Student, Department } = require("../src/models");

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log("DB connected for debug");

    const userId = 32; // test tutor created earlier

    console.log("User associations:", Object.keys(User.associations));

    const userWithAssocByName = await User.findByPk(userId, { include: { association: 'Staff' } });
    console.log("User with include by association:", JSON.stringify(userWithAssocByName, null, 2));

    const staffRecord = await Staff.findOne({ where: { UserUserId: userId } });
    console.log("Staff record lookup:", JSON.stringify(staffRecord, null, 2));

    const students = await Student.findAll({ where: { DepartmentDepartmentId: staffRecord?.DepartmentDepartmentId || null } });
    console.log(`Students in department ${staffRecord?.DepartmentDepartmentId}:`, students.length);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
