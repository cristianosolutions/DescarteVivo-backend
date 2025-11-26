const express = require("express");
const router = express.Router();
const pool = require("../db");

const generatePointsReport = require("../reports/pointsReport");
const generateUsersReport = require("../reports/usersReport");
const generateDeliveriesReport = require("../reports/deliveriesReport");
const generateDashboardReport = require("../reports/dashboardReport");

// Pontos de coleta
router.get("/points", async (req, res) => {
  const result = await pool.query("SELECT * FROM collection_points ORDER BY created_at DESC");
  generatePointsReport(res, result.rows);
});

// Usuários
router.get("/users", async (req, res) => {
  const result = await pool.query("SELECT name, email, role, created_at FROM users ORDER BY created_at DESC");
  generateUsersReport(res, result.rows);
});

// Entregas com filtros por data
router.get("/deliveries", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT wd.id,
             wd.created_at,
             u.name AS user_name,
             cp.name AS point_name,
             wdi.quantity_kg,
             wt.name AS waste_name
      FROM waste_deliveries wd
      JOIN users u ON u.id = wd.user_id
      JOIN collection_points cp ON cp.id = wd.collection_point_id
      JOIN waste_delivery_items wdi ON wdi.delivery_id = wd.id
      JOIN waste_types wt ON wt.id = wdi.waste_type_id
      ORDER BY wd.created_at DESC
    `);

    generateDeliveriesReport(res, result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao gerar relatório de entregas");
  }
});


// Dashboard full
router.get("/dashboard", async (req, res) => {
  generateDashboardReport(res);
});

module.exports = router;
