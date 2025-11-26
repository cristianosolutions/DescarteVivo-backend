const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');


const router = express.Router();

// POST /api/deliveries - registrar entrega
router.post('/', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { user_id, collection_point_id, items } = req.body;

    if (!user_id || !collection_point_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Dados incompletos da entrega.' });
    }

    const totalKg = items.reduce((sum, item) => sum + Number(item.quantity_kg), 0);

    await client.query('BEGIN');

    const deliveryResult = await client.query(
      `INSERT INTO waste_deliveries (user_id, collection_point_id, total_kg)
       VALUES ($1, $2, $3)
       RETURNING id, created_at`,
      [user_id, collection_point_id, totalKg]
    );

    const delivery = deliveryResult.rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO waste_delivery_items (delivery_id, waste_type_id, quantity_kg)
         VALUES ($1, $2, $3)`,
        [delivery.id, item.waste_type_id, item.quantity_kg]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ delivery_id: delivery.id, created_at: delivery.created_at });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Erro ao registrar entrega.' });
  } finally {
    client.release();
  }
});

// GET /api/deliveries - listar entregas resumidas
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.id,
             u.name AS user_name,
             cp.name AS point_name,
             d.created_at,
             COALESCE(SUM(wdi.quantity_kg), 0) AS total_kg
      FROM waste_deliveries d
      JOIN users u ON u.id = d.user_id
      JOIN collection_points cp ON cp.id = d.collection_point_id
      LEFT JOIN waste_delivery_items wdi ON wdi.delivery_id = d.id
      GROUP BY d.id, u.name, cp.name
      ORDER BY d.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao listar entregas.' });
  }
});


module.exports = router;
