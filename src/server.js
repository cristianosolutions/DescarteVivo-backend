const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

// Importação das rotas
const authMiddleware = require("./middleware/auth");
const usersRouter = require('./routes/users');
const pointsRouter = require('./routes/collectionPoints');
const deliveriesRouter = require('./routes/deliveries');
const wasteTypesRouter = require('./routes/wasteTypes');
const dashboardRouter = require('./routes/dashboard');
const reportRoutes = require("./routes/reportRoutes");

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'API DescarteVivo funcionando' });
});

// Rotas públicas
app.use('/api/reports', reportRoutes);          // Relatórios PDF (liberado)
app.use('/api/users/', usersRouter);       // Login

// Rotas privadas (com autenticação)
app.use('/api/points', authMiddleware, pointsRouter);
app.use('/api/deliveries', authMiddleware, deliveriesRouter);
app.use('/api/waste-types', authMiddleware, wasteTypesRouter);
app.use('/api/dashboard', authMiddleware, dashboardRouter);

// Inicialização do servidor
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Backend rodando na porta ${port}`);
});
