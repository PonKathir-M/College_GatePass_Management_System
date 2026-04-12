const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Announcement = sequelize.define("Announcement", {
    announcement_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    target_audience: {
        type: DataTypes.STRING,
        defaultValue: "all", // "all", "1", "2", "3", "4"
        comment: "Target year or 'all'"
    },
    priority: {
        type: DataTypes.ENUM("normal", "urgent"),
        defaultValue: "normal"
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
});

module.exports = Announcement;
