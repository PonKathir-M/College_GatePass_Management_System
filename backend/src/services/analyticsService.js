const { GatePass, sequelize } = require("../models");

exports.departmentWiseStats = async () => {
  const [data] = await sequelize.query(`
    SELECT status, COUNT(*) as count
    FROM GatePasses
    GROUP BY status
  `);
  return data;
};

exports.yearlyCount = async () => {
  const [data] = await sequelize.query(`
    SELECT YEAR(createdAt) as year, COUNT(*) as total
    FROM GatePasses
    GROUP BY YEAR(createdAt)
  `);
  return data;
};
