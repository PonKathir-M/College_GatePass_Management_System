const sequelize = require("./src/config/database");

const updateSchema = async () => {
    try {
        await sequelize.authenticate();
        console.log("Connected to database.");

        // Attempt to add the column
        // MySQL sytax: ALTER TABLE Users ADD COLUMN needs_password_change TINYINT(1) DEFAULT 1;
        await sequelize.query("ALTER TABLE Users ADD COLUMN needs_password_change TINYINT(1) DEFAULT 1;");
        console.log("✅ Successfully added 'needs_password_change' column to Users table.");
    } catch (err) {
        if (err.original && err.original.code === 'ER_DUP_FIELDNAME') {
            console.log("ℹ️ Column 'needs_password_change' already exists. No changes needed.");
        } else {
            console.error("❌ Error updating schema:", err.message);
        }
    } finally {
        await sequelize.close();
    }
};

updateSchema();
