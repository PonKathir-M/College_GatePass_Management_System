const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SecurityLog = sequelize.define("SecurityLog", {
  actual_out: DataTypes.DATE,
  actual_in: DataTypes.DATE,
  checked_out_by: DataTypes.INTEGER,
  checked_in_by: DataTypes.INTEGER
});

module.exports = SecurityLog;
