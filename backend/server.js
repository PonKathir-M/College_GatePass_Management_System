const express = require("express");
const cors = require("cors");
const { DataTypes } = require("sequelize");
const path = require("path");
require("dotenv").config();

const sequelize = require("./src/config/database");
require("./src/models");
const routes = require("./src/routes");
const errorHandler = require("./src/middleware/errorHandler");
const { seedDatabase } = require("./src/services/seedService");

const app = express();
const port = Number(process.env.PORT) || 5001;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api", routes);
app.use(errorHandler);

const ensureStudentMobileColumn = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const tableDesc = await queryInterface.describeTable("Students");

  if (!tableDesc.student_mobile_number) {
    console.log("Adding missing column: Students.student_mobile_number");
    await queryInterface.addColumn("Students", "student_mobile_number", {
      type: DataTypes.STRING(15),
      allowNull: true
    });
    console.log("Added column: Students.student_mobile_number");
  }
};

const runMigrations = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected");

    await sequelize.sync();
    console.log("Tables synchronized");

    await ensureStudentMobileColumn();

    await seedDatabase();
    console.log("Database seeded with demo data");

    return true;
  } catch (err) {
    console.error("DB Error:", err);
    return false;
  }
};

runMigrations().then((success) => {
  if (success) {
    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(
          `Port ${port} is already in use. Another backend instance may already be running.`
        );
        console.error(
          `Stop the process using port ${port} or change PORT in backend/.env, then try again.`
        );
        process.exit(1);
      }

      console.error("Server startup error:", err);
      process.exit(1);
    });
  }
});
