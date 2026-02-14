const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Notification = sequelize.define("Notification", {
  UserUserId: DataTypes.INTEGER,
  sender: DataTypes.STRING,
  message: DataTypes.STRING,
  type: DataTypes.STRING,
  reference_id: DataTypes.STRING,
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = Notification;
