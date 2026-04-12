const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('./src/config/database');

const queryInterface = sequelize.getQueryInterface();

async function addColumn() {
    try {
        await queryInterface.addColumn('Notifications', 'UserUserId', {
            type: DataTypes.INTEGER,
            references: {
                model: 'Users', // name of Target model
                key: 'user_id', // key in Target model that we're referencing
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        });
        console.log('Column added successfully');
    } catch (error) {
        if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists');
        } else {
            console.error('Error adding column:', error);
        }
    } finally {
        await sequelize.close();
    }
}

addColumn();
