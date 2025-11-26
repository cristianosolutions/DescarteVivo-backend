const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/summary
router.get('/summary', auth, async (req, res) => {
  try {
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
    const totalPoints = await pool.query('SELECT COUNT(*) FROM collection_points');
    const totalDeliveries = await pool.query('SELECT COUNT(*) FROM waste_deliveries');
    const totalKg = await pool.query(
      'SELECT COALESCE(SUM(quantity_kg),0) AS total_kg FROM waste_delivery_items'
    );
    const byType = await pool.query(
      `SELECT wt.name, COALESCE(SUM(wdi.quantity_kg),0) AS total_kg
       FROM waste_types wt
       LEFT JOIN waste_delivery_items wdi ON wdi.waste_type_id = wt.id
       GROUP BY wt.name
       ORDER BY wt.name`
    );

    res.json({
      totals: {
        users: Number(totalUsers.rows[0].count),
        points: Number(totalPoints.rows[0].count),
        deliveries: Number(totalDeliveries.rows[0].count),
        totalKg: Number(totalKg.rows[0].total_kg)
      },
      byType: byType.rows.map(r => ({
        name: r.name,
        total_kg: Number(r.total_kg)
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao carregar resumo do dashboard.' });
  }
});

module.exports = router;
