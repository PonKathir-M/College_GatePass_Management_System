const sequelize = require('./src/config/database');

async function checkSchema() {
    try {
        const [results, metadata] = await sequelize.query("DESCRIBE Notifications");
        console.log(results);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkSchema();
