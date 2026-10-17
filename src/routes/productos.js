const express  = require('express');
const router   = express.Router();
const { getDb } = require('../db');

// GET /api/productos
router.get('/', async (req, res) => {
    try {
        const db = await getDb();
        const { categoria_id, buscar, activo = 'true' } = req.query;
        const args = [activo === 'true' || activo === '1'];
        let sql = `SELECT p.*, c.nombre AS categoria
                   FROM productos p
                   LEFT JOIN categorias c ON p.categoria_id = c.id
                   WHERE p.activo = $1`;
        let i = 2;
        if (categoria_id) { sql += ` AND p.categoria_id = $${i++}`; args.push(Number(categoria_id)); }
        if (buscar)       { sql += ` AND (p.nombre ILIKE $${i} OR p.descripcion ILIKE $${i})`; i++; args.push(`%${buscar}%`); }
        sql += ' ORDER BY p.id DESC';
        const { rows } = await db.query(sql, args);
        res.json(rows);
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/productos/:id
router.get('/:id', async (req, res) => {
    try {
        const db = await getDb();
        const { rows } = await db.query(
            `SELECT p.*, c.nombre AS categoria FROM productos p
             LEFT JOIN categorias c ON p.categoria_id = c.id WHERE p.id = $1`,
            [req.params.id]
        );
        if (!rows[0]) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json(rows[0]);
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/productos
router.post('/', async (req, res) => {
    try {
        const db = await getDb();
        const { nombre, descripcion, precio, stock = 0, imagen_url, categoria_id } = req.body;
        if (!nombre || precio === undefined) return res.status(400).json({ error: 'nombre y precio son requeridos' });
        const { rows } = await db.query(
            `INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url, categoria_id)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
            [nombre, descripcion || null, precio, stock, imagen_url || null, categoria_id || null]
        );
        res.status(201).json({ id: rows[0].id, ...req.body });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/productos/:id
router.put('/:id', async (req, res) => {
    try {
        const db = await getDb();
        const { nombre, descripcion, precio, stock, imagen_url, categoria_id, activo } = req.body;
        await db.query(
            `UPDATE productos SET
                nombre       = COALESCE($1, nombre),
                descripcion  = COALESCE($2, descripcion),
                precio       = COALESCE($3, precio),
                stock        = COALESCE($4, stock),
                imagen_url   = COALESCE($5, imagen_url),
                categoria_id = COALESCE($6, categoria_id),
                activo       = COALESCE($7, activo),
                actualizado_en = NOW()
             WHERE id = $8`,
            [nombre||null, descripcion||null, precio!=null?Number(precio):null,
             stock!=null?Number(stock):null, imagen_url||null,
             categoria_id!=null?Number(categoria_id):null,
             activo!=null?Boolean(activo):null, req.params.id]
        );
        res.json({ message: 'Producto actualizado' });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/productos/:id (baja lógica)
router.delete('/:id', async (req, res) => {
    try {
        const db = await getDb();
        await db.query('UPDATE productos SET activo = false WHERE id = $1', [req.params.id]);
        res.json({ message: 'Producto desactivado' });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
