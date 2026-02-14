const sequelize = require("./src/config/database");

const updateSchema = async () => {
    try {
        await sequelize.authenticate();
        console.log("Connected to database.");

        // Attempt to add the column
        await sequelize.query("ALTER TABLE Students ADD COLUMN is_suspended TINYINT(1) DEFAULT 0;");
        console.log("✅ Successfully added 'is_suspended' column to Students table.");
    } catch (err) {
        if (err.original && err.original.code === 'ER_DUP_FIELDNAME') {
            console.log("ℹ️ Column 'is_suspended' already exists. No changes needed.");
        } else {
            console.error("❌ Error updating schema:", err.message);
        }
    } finally {
        await sequelize.close();
    }
};

updateSchema();
