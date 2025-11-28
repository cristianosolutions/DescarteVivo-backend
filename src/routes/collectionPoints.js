const express = require('express');
const pool = require('../db');

const router = express.Router();

// POST /api/points - criar ponto de coleta
router.post('/', async (req, res) => {
  try {
    const { name, address, neighborhood, city, state, status  } = req.body;

    if (!name || !address || !neighborhood || !city || !state) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    const pointStatus = status || 'active';

    const result = await pool.query(
      `INSERT INTO collection_points (name, address, neighborhood, city, state, status )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, address, neighborhood, city, state, pointStatus]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao criar ponto de coleta.' });
  }
});

// GET /api/points - listar pontos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM collection_points ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao listar pontos de coleta.' });
  }
});

module.exports = router;
