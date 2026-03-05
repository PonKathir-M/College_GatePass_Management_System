const { Department } = require('./src/models');
const sequelize = require('./src/config/database');

async function listDepartments() {
    try {
        const depts = await Department.findAll();
        console.log(JSON.stringify(depts, null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

listDepartments();
