const express  = require('express');
const router   = express.Router();
const { getDb } = require('../db');

// GET /api/categorias
router.get('/', async (req, res) => {
    try {
        const db = await getDb();
        const { rows } = await db.query('SELECT * FROM categorias ORDER BY nombre');
        res.json(rows);
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/categorias
router.post('/', async (req, res) => {
    try {
        const db = await getDb();
        const { nombre, descripcion } = req.body;
        if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });
        const { rows } = await db.query(
            `INSERT INTO categorias (nombre, descripcion) VALUES ($1, $2)
             ON CONFLICT (nombre) DO NOTHING RETURNING id`,
            [nombre, descripcion || null]
        );
        res.status(201).json({ id: rows[0]?.id, nombre, descripcion });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
