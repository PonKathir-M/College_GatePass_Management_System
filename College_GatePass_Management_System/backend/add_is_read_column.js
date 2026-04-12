const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('./src/config/database');

const queryInterface = sequelize.getQueryInterface();

async function addIsReadColumn() {
    try {
        await queryInterface.addColumn('Notifications', 'is_read', {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        });
        console.log('is_read column added successfully');
    } catch (error) {
        console.error('Error adding column:', error);
    } finally {
        await sequelize.close();
    }
}

addIsReadColumn();
