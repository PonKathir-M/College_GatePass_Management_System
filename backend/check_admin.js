const sequelize = require("./src/config/database");

const checkAdmin = async () => {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query("SELECT email, needs_password_change FROM Users WHERE role='admin'");
        console.log("Admin Users:", results);
    } catch (err) {
        console.error(err);
    } finally {
        await sequelize.close();
    }
};

checkAdmin();
