const sequelize = require("./src/config/database");

const fixAdminFlag = async () => {
    try {
        await sequelize.authenticate();
        console.log("Connected to database.");

        const [results, metadata] = await sequelize.query(
            "UPDATE Users SET needs_password_change = 0 WHERE role = 'admin'"
        );

        console.log("✅ Updated admin users: needs_password_change set to false/0.");
    } catch (err) {
        console.error("❌ Error updating admin:", err.message);
    } finally {
        await sequelize.close();
    }
};

fixAdminFlag();
