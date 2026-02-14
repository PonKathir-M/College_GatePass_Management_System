const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const sequelize = require("./src/config/database");
const models = require("./src/models");
const routes = require("./src/routes");
const errorHandler = require("./src/middleware/errorHandler");
const { seedDatabase } = require("./src/services/seedService");

const app = express();

app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());

app.use("/api", routes);

app.use(errorHandler);

const runMigrations = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    await sequelize.sync();
    console.log("✅ Tables synchronized");

    // Seed demo data
    await seedDatabase();
    console.log("✅ Database seeded with demo data");

    return true;
  } catch (err) {
    console.error("❌ DB Error:", err);
    return false;
  }
};

runMigrations().then(success => {
  if (success) {
    app.listen(process.env.PORT, () =>
      console.log(`🚀 Server running on port ${process.env.PORT}`)
    );
  }
});
