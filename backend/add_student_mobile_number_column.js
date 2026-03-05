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

const addStudentMobileNumberColumn = async () => {
    try {
        const queryInterface = sequelize.getQueryInterface();

        const tableDesc = await queryInterface.describeTable('Students');

        if (!tableDesc.student_mobile_number) {
            console.log('Adding student_mobile_number column...');
            await queryInterface.addColumn('Students', 'student_mobile_number', {
                type: DataTypes.STRING(15),
                allowNull: true
            });
            console.log('student_mobile_number column added successfully');
        } else {
            console.log('student_mobile_number column already exists');
        }
    } catch (error) {
        console.error('Error adding student_mobile_number column:', error);
    } finally {
        await sequelize.close();
    }
};

addStudentMobileNumberColumn();
