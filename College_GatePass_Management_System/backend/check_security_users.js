const { User, Staff } = require('./src/models');
const sequelize = require('./src/config/database');

async function checkSecurityUsers() {
    try {
        const users = await User.findAll({
            where: { role: 'security' },
            attributes: ['email', 'password', 'role', 'name', 'active']
        });
        console.log('Security Users:', JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkSecurityUsers();
