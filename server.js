const express = require('express');
const path    = require('path');
const cors    = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Servir el frontend estático
app.use(express.static(path.join(__dirname, 'public')));

// --- Rutas de la API ---
app.use('/api/productos',  require('./src/routes/productos'));
app.use('/api/categorias', require('./src/routes/categorias'));
app.use('/api/pedidos',    require('./src/routes/pedidos'));
app.use('/api/servicios',  require('./src/routes/servicios'));
app.use('/api/admin',      require('./src/routes/admin').router);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Cualquier otra ruta → devuelve el index.html
app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀  Servidor corriendo en http://localhost:${PORT}`);
});
