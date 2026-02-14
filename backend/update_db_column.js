const sequelize = require("./src/config/database");

const updateSchema = async () => {
    try {
        await sequelize.authenticate();
        console.log("Connected to database.");

        // Attempt to add the column
        await sequelize.query("ALTER TABLE Students ADD COLUMN profile_pic VARCHAR(255);");
        console.log("✅ Successfully added 'profile_pic' column to Students table.");
    } catch (err) {
        if (err.original && err.original.code === 'ER_DUP_FIELDNAME') {
            console.log("ℹ️ Column 'profile_pic' already exists. No changes needed.");
        } else {
            console.error("❌ Error updating schema:", err.message);
        }
    } finally {
        await sequelize.close();
    }
};

updateSchema();
