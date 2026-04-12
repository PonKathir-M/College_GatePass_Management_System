const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
  user_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: DataTypes.STRING,
  email: { type: DataTypes.STRING, unique: true },
  password: DataTypes.STRING,
  role: DataTypes.STRING,
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
  needs_password_change: { type: DataTypes.BOOLEAN, defaultValue: true }
});

module.exports = User;
