const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Staff = sequelize.define("Staff", {
  staff_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  role: DataTypes.STRING,
  UserUserId: DataTypes.INTEGER,
  DepartmentDepartmentId: DataTypes.INTEGER
});

module.exports = Staff;
