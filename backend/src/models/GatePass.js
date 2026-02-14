const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const GatePass = sequelize.define("GatePass", {
  gatepass_id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  reason: DataTypes.STRING,
  out_time: DataTypes.TIME,
  expected_return: DataTypes.TIME,
  status: DataTypes.STRING,
  rejection_reason: DataTypes.STRING
});

module.exports = GatePass;
