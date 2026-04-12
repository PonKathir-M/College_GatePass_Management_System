const bcrypt = require('bcryptjs');
const { User } = require('./src/models');
const sequelize = require('./src/config/database');

async function resetSecurityPassword() {
    try {
        const email = 'security@gmail.com';
        const newPassword = 'security123';

        const hash = await bcrypt.hash(newPassword, 10);

        await User.update(
            { password: hash, active: true },
            { where: { email, role: 'security' } }
        );

        console.log(`Password for ${email} reset to ${newPassword}`);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

resetSecurityPassword();
