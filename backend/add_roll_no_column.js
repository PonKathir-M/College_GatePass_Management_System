const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: console.log,
    }
);

const addRollNoColumn = async () => {
    try {
        const queryInterface = sequelize.getQueryInterface();

        // Check if column exists
        const tableDesc = await queryInterface.describeTable('Students');

        if (!tableDesc.roll_no) {
            console.log('Adding roll_no column...');
            await queryInterface.addColumn('Students', 'roll_no', {
                type: DataTypes.STRING,
                allowNull: true, // Allow null for existing records
                unique: true
            });
            console.log('✅ roll_no column added successfully');
        } else {
            console.log('ℹ️ roll_no column already exists');
        }

    } catch (error) {
        console.error('❌ Error adding column:', error);
    } finally {
        await sequelize.close();
    }
};

addRollNoColumn();
