const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const WardenApproval = sequelize.define("WardenApproval", {
  approved: DataTypes.BOOLEAN,
  reason: DataTypes.STRING
});

module.exports = WardenApproval;
