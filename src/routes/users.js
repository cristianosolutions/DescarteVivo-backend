const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ----------------------
// ROTA PÚBLICA: LOGIN
// ----------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const user = result.rows[0];
    const passwordOk = await bcrypt.compare(password, user.password_hash);

    if (!passwordOk) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao autenticar usuário.' });
  }
});

// -----------------------------
// ROTAS PRIVADAS
// -----------------------------
router.use(authMiddleware);

router.post('/', async (req, res) => {
  ...
});

router.get('/', async (req, res) => {
  ...
});

module.exports = router;
