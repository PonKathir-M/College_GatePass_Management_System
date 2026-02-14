const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Department = sequelize.define("Department", {
  department_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  department_name: DataTypes.STRING
});

module.exports = Department;
