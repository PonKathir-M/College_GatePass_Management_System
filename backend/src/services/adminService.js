const { User, Student, Staff, Department } = require("../models");

exports.deactivateUser = async (userId) => {
  const user = await User.findByPk(userId);
  user.active = false;
  await user.save();
  return user;
};

exports.updateStudentCategory = async (studentId, category) => {
  const student = await Student.findByPk(studentId);
  student.category = category;
  await student.save();
  return student;
};

exports.departmentWiseStudents = async () => {
  return await Department.findAll({
    include: [Student]
  });
};
