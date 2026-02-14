const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Student = sequelize.define("Student", {
  student_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  year: DataTypes.INTEGER,
  category: DataTypes.STRING,
  parent_phone: DataTypes.STRING,
  profile_pic: { type: DataTypes.STRING, allowNull: true },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
  is_suspended: { type: DataTypes.BOOLEAN, defaultValue: false },
  DepartmentDepartmentId: DataTypes.INTEGER,
  UserUserId: DataTypes.INTEGER,
  AssignedStaffStaffId: DataTypes.INTEGER
});

module.exports = Student;
