const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const TutorApproval = sequelize.define("TutorApproval", {
  approved: DataTypes.BOOLEAN,
  reason: DataTypes.STRING
});

module.exports = TutorApproval;
