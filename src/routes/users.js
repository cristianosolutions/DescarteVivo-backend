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
      process.env.JWT_SECRET || 'segredo_dev',
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
// A PARTIR DAQUI: ROTAS PROTEGIDAS
// -----------------------------
router.use(authMiddleware);

// POST /api/users - cadastrar usuário
router.post('/', async (req, res) => {
  try {
    const { name, email, password, address, birth_date, role } = req.body;

    if (!name || !email || !password || !address || !birth_date) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, endereco_completo, data_nascimento, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, created_at`,
      [name, email, address, birth_date, hash, role || 'MORADOR']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Email já cadastrado.' });
    }
    res.status(500).json({ message: 'Erro ao cadastrar usuário.' });
  }
});

// GET /api/users - listar usuários
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.created_at,
        EXISTS (SELECT 1 FROM waste_deliveries wd WHERE wd.user_id = u.id) AS has_deliveries
      FROM users u
      ORDER BY u.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao listar usuários.' });
  }
});


// PUT /users/:id - atualizar usuário
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, address, birth_date, role } = req.body;

    const checkUser = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    await pool.query(
      `UPDATE users SET name=$1, email=$2, endereco_completo=$3, data_nascimento=$4, role=$5
       WHERE id=$6`,
      [name, email, address, birth_date, role, id]
    );

    return res.status(200).json({ message: 'Usuário atualizado com sucesso!' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao atualizar usuário.' });
  }
});

// DELETE /users/:id - bloquear exclusão se houver entregas vinculadas
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica se o usuário existe
    const checkUser = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    // Verifica se existe entrega vinculada
    const checkDeliveries = await pool.query(
      'SELECT * FROM waste_deliveries WHERE user_id = $1',
      [id]
    );

    if (checkDeliveries.rows.length > 0) {
      return res.status(400).json({
        message: "Não é possível excluir este usuário pois existem entregas vinculadas ao mesmo."
      });
    }

    // Se não houver entrega, remove o usuário
    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    return res.status(200).json({ message: 'Usuário removido com sucesso!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao excluir usuário' });
  }
});



module.exports = router;

/*const express = require('express');
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
      process.env.JWT_SECRET || 'segredo_dev',
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
// A PARTIR DAQUI: ROTAS PROTEGIDAS
// -----------------------------
router.use(authMiddleware);

// POST /api/users - cadastrar usuário
router.post('/', async (req, res) => {
  try {
    const { name, email, password, address, birth_date, role } = req.body;

    if (!name || !email || !password || !address || !birth_date) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, endereco_completo, data_nascimento, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, created_at`,
      [name, email, address, birth_date, hash, role || 'MORADOR']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Email já cadastrado.' });
    }
    res.status(500).json({ message: 'Erro ao cadastrar usuário.' });
  }
});

// GET /api/users - listar usuários
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao listar usuários.' });
  }
});

module.exports = router;*/
