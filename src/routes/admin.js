const express  = require('express');
const router   = express.Router();
const { getDb } = require('../db');

// Contraseña admin simple (en producción usar bcrypt + JWT real)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'xolchiltepec2025';
const ADMIN_TOKEN    = process.env.ADMIN_TOKEN    || 'xolchi-admin-secret-token';

// POST /api/admin/login
router.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.json({ token: ADMIN_TOKEN, message: 'Bienvenido administrador' });
    } else {
        res.status(401).json({ error: 'Contraseña incorrecta' });
    }
});

// Middleware de autenticación admin
function authAdmin(req, res, next) {
    const auth = req.headers['authorization'] || '';
    const token = auth.replace('Bearer ', '');
    if (token === ADMIN_TOKEN) return next();
    res.status(401).json({ error: 'No autorizado' });
}

// GET /api/admin/dashboard — resumen general
router.get('/dashboard', authAdmin, async (req, res) => {
    try {
        const db = await getDb();
        const [productos, pedidos, servicios, movimientos, logs] = await Promise.all([
            db.query('SELECT COUNT(*) AS total, SUM(stock) AS stock_total FROM productos WHERE activo = true'),
            db.query(`SELECT COUNT(*) AS total, COALESCE(SUM(total),0) AS ingresos FROM pedidos`),
            db.query('SELECT COUNT(*) AS total FROM servicios WHERE activo = true'),
            db.query('SELECT COUNT(*) AS total FROM movimientos_inventario'),
            db.query('SELECT * FROM admin_logs ORDER BY creado_en DESC LIMIT 20')
        ]);
        res.json({
            productos:   productos.rows[0],
            pedidos:     pedidos.rows[0],
            servicios:   servicios.rows[0],
            movimientos: movimientos.rows[0],
            logs_recientes: logs.rows
        });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/admin/pedidos — todos los pedidos con detalle
router.get('/pedidos', authAdmin, async (req, res) => {
    try {
        const db = await getDb();
        const { rows } = await db.query(
            `SELECT p.*, cl.nombre AS cliente_nombre, cl.email AS cliente_email, cl.telefono
             FROM pedidos p JOIN clientes cl ON p.cliente_id = cl.id
             ORDER BY p.creado_en DESC`
        );
        res.json(rows);
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/admin/movimientos — historial de inventario
router.get('/movimientos', authAdmin, async (req, res) => {
    try {
        const db = await getDb();
        const { rows } = await db.query(
            `SELECT m.*, p.nombre AS producto_nombre
             FROM movimientos_inventario m JOIN productos p ON m.producto_id = p.id
             ORDER BY m.creado_en DESC LIMIT 100`
        );
        res.json(rows);
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/admin/logs — log de acciones admin
router.get('/logs', authAdmin, async (req, res) => {
    try {
        const db = await getDb();
        const { rows } = await db.query('SELECT * FROM admin_logs ORDER BY creado_en DESC LIMIT 100');
        res.json(rows);
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/admin/productos/:id — editar producto (con log)
router.put('/productos/:id', authAdmin, async (req, res) => {
    try {
        const db = await getDb();
        const { nombre, descripcion, precio, stock, imagen_url, activo } = req.body;
        await db.query(
            `UPDATE productos SET
                nombre       = COALESCE($1, nombre),
                descripcion  = COALESCE($2, descripcion),
                precio       = COALESCE($3, precio),
                stock        = COALESCE($4, stock),
                imagen_url   = COALESCE($5, imagen_url),
                activo       = COALESCE($6, activo),
                actualizado_en = NOW()
             WHERE id = $7`,
            [nombre||null, descripcion||null, precio!=null?Number(precio):null,
             stock!=null?Number(stock):null, imagen_url||null,
             activo!=null?Boolean(activo):null, req.params.id]
        );
        await db.query(
            `INSERT INTO admin_logs (accion, entidad, entidad_id, detalle) VALUES ('EDITAR','producto',$1,$2)`,
            [req.params.id, `Editó producto ID ${req.params.id}: ${JSON.stringify(req.body)}`]
        );
        res.json({ message: 'Producto actualizado' });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/admin/productos — crear producto (con log)
router.post('/productos', authAdmin, async (req, res) => {
    try {
        const db = await getDb();
        const { nombre, descripcion, precio, stock = 0, imagen_url, categoria_id } = req.body;
        if (!nombre || precio === undefined) return res.status(400).json({ error: 'nombre y precio son requeridos' });
        const { rows } = await db.query(
            `INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url, categoria_id)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
            [nombre, descripcion||null, precio, stock, imagen_url||null, categoria_id||null]
        );
        await db.query(
            `INSERT INTO admin_logs (accion, entidad, entidad_id, detalle) VALUES ('CREAR','producto',$1,$2)`,
            [rows[0].id, `Creó producto: ${nombre}`]
        );
        res.status(201).json({ id: rows[0].id, ...req.body });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/admin/productos/:id — eliminar producto (con log)
router.delete('/productos/:id', authAdmin, async (req, res) => {
    try {
        const db = await getDb();
        await db.query('UPDATE productos SET activo = false WHERE id = $1', [req.params.id]);
        await db.query(
            `INSERT INTO admin_logs (accion, entidad, entidad_id, detalle) VALUES ('ELIMINAR','producto',$1,$2)`,
            [req.params.id, `Desactivó producto ID ${req.params.id}`]
        );
        res.json({ message: 'Producto desactivado' });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// Ajuste manual de stock
router.post('/productos/:id/stock', authAdmin, async (req, res) => {
    try {
        const db = await getDb();
        const { cantidad, tipo = 'ajuste', motivo = 'Ajuste manual admin' } = req.body;
        if (!cantidad) return res.status(400).json({ error: 'cantidad requerida' });

        const delta = tipo === 'entrada' ? Number(cantidad) : -Number(cantidad);
        await db.query(
            'UPDATE productos SET stock = GREATEST(0, stock + $1), actualizado_en = NOW() WHERE id = $2',
            [delta, req.params.id]
        );
        await db.query(
            `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo) VALUES ($1,$2,$3,$4)`,
            [req.params.id, tipo, Number(cantidad), motivo]
        );
        await db.query(
            `INSERT INTO admin_logs (accion, entidad, entidad_id, detalle) VALUES ('STOCK','producto',$1,$2)`,
            [req.params.id, `Ajuste stock ${tipo}: ${cantidad} — ${motivo}`]
        );
        res.json({ message: 'Stock actualizado' });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = { router, authAdmin };
