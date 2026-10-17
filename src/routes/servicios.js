const express  = require('express');
const router   = express.Router();
const { getDb } = require('../db');

// GET /api/servicios
router.get('/', async (req, res) => {
    try {
        const db = await getDb();
        const { rows } = await db.query('SELECT * FROM servicios WHERE activo = true ORDER BY id');
        res.json(rows);
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/servicios/:id
router.get('/:id', async (req, res) => {
    try {
        const db = await getDb();
        const { rows } = await db.query('SELECT * FROM servicios WHERE id = $1', [req.params.id]);
        if (!rows[0]) return res.status(404).json({ error: 'Servicio no encontrado' });
        res.json(rows[0]);
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/servicios (admin)
router.post('/', async (req, res) => {
    try {
        const db = await getDb();
        const { nombre, descripcion, precio_base = 0, imagen_url } = req.body;
        if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });
        const { rows } = await db.query(
            `INSERT INTO servicios (nombre, descripcion, precio_base, imagen_url) VALUES ($1,$2,$3,$4) RETURNING id`,
            [nombre, descripcion || null, precio_base, imagen_url || null]
        );
        await db.query(
            `INSERT INTO admin_logs (accion, entidad, entidad_id, detalle) VALUES ('CREAR','servicio',$1,$2)`,
            [rows[0].id, `Creó servicio: ${nombre}`]
        );
        res.status(201).json({ id: rows[0].id, ...req.body });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/servicios/:id (admin)
router.put('/:id', async (req, res) => {
    try {
        const db = await getDb();
        const { nombre, descripcion, precio_base, imagen_url, activo } = req.body;
        await db.query(
            `UPDATE servicios SET
                nombre       = COALESCE($1, nombre),
                descripcion  = COALESCE($2, descripcion),
                precio_base  = COALESCE($3, precio_base),
                imagen_url   = COALESCE($4, imagen_url),
                activo       = COALESCE($5, activo),
                actualizado_en = NOW()
             WHERE id = $6`,
            [nombre||null, descripcion||null, precio_base!=null?Number(precio_base):null,
             imagen_url||null, activo!=null?Boolean(activo):null, req.params.id]
        );
        await db.query(
            `INSERT INTO admin_logs (accion, entidad, entidad_id, detalle) VALUES ('EDITAR','servicio',$1,$2)`,
            [req.params.id, `Editó servicio ID ${req.params.id}`]
        );
        res.json({ message: 'Servicio actualizado' });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/servicios/:id (admin - baja lógica)
router.delete('/:id', async (req, res) => {
    try {
        const db = await getDb();
        await db.query('UPDATE servicios SET activo = false WHERE id = $1', [req.params.id]);
        await db.query(
            `INSERT INTO admin_logs (accion, entidad, entidad_id, detalle) VALUES ('ELIMINAR','servicio',$1,$2)`,
            [req.params.id, `Desactivó servicio ID ${req.params.id}`]
        );
        res.json({ message: 'Servicio desactivado' });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
