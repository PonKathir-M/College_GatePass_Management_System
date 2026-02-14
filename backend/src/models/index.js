const sequelize = require("../config/database");

const User = require("./User");
const Department = require("./Department");
const Staff = require("./Staff");
const Student = require("./Student");
const GatePass = require("./GatePass");
const TutorApproval = require("./TutorApproval");
const WardenApproval = require("./WardenApproval");
const SecurityLog = require("./SecurityLog");
const Notification = require("./Notification");
const Announcement = require("./Announcement");

/* Associations */

Department.hasMany(Staff, { as: "Staffs", foreignKey: "DepartmentDepartmentId" });
Staff.belongsTo(Department, { as: "Department", foreignKey: "DepartmentDepartmentId" });

Department.hasMany(Student, { as: "Students", foreignKey: "DepartmentDepartmentId" });
Student.belongsTo(Department, { as: "Department", foreignKey: "DepartmentDepartmentId" });

Department.hasMany(Announcement, { foreignKey: "DepartmentDepartmentId" });
Announcement.belongsTo(Department, { foreignKey: "DepartmentDepartmentId" });

Staff.hasMany(Announcement, { foreignKey: "StaffStaffId" });
Announcement.belongsTo(Staff, { foreignKey: "StaffStaffId" });

User.hasOne(Staff, { as: "Staff", foreignKey: "UserUserId" });
Staff.belongsTo(User, { as: "User", foreignKey: "UserUserId" });

User.hasOne(Student, { as: "Student", foreignKey: "UserUserId" });
Student.belongsTo(User, { as: "User", foreignKey: "UserUserId" });

// Tutor assignment relationship
Staff.hasMany(Student, { as: "AssignedStudents", foreignKey: "AssignedStaffStaffId" });
Student.belongsTo(Staff, { as: "AssignedStaff", foreignKey: "AssignedStaffStaffId" });

Student.hasMany(GatePass);
GatePass.belongsTo(Student);

GatePass.hasOne(TutorApproval);
TutorApproval.belongsTo(GatePass);

GatePass.hasOne(WardenApproval);
WardenApproval.belongsTo(GatePass);

GatePass.hasOne(SecurityLog, { foreignKey: "GatePassGatepassId" });
SecurityLog.belongsTo(GatePass, { foreignKey: "GatePassGatepassId" });

SecurityLog.belongsTo(User, { as: "CheckedOutBy", foreignKey: "checked_out_by" });
SecurityLog.belongsTo(User, { as: "CheckedInBy", foreignKey: "checked_in_by" });

User.hasMany(Notification, { foreignKey: "UserUserId" });

module.exports = {
  sequelize,
  User,
  Department,
  Staff,
  Student,
  GatePass,
  TutorApproval,
  WardenApproval,
  SecurityLog,
  Notification,
  Announcement
};
