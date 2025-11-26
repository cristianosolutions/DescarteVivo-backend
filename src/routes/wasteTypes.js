const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET /api/waste-types
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name FROM waste_types ORDER BY id ASC"
    );
    
    console.log("TIPOS DE RESÍDUOS:", result.rows); // << debug

    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao carregar tipos de resíduos:", error);
    res.status(500).json({ message: "Erro ao carregar tipos de resíduos" });
  }
});

module.exports = router;
