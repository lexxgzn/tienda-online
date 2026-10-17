const express  = require('express');
const router   = express.Router();
const { getDb } = require('../db');

// POST /api/pedidos
router.post('/', async (req, res) => {
    const db = await getDb();
    const { cliente, items, direccion_envio, notas } = req.body;

    if (!cliente?.nombre || !cliente?.email)
        return res.status(400).json({ error: 'Se requieren nombre y email del cliente' });
    if (!Array.isArray(items) || items.length === 0)
        return res.status(400).json({ error: 'El pedido debe incluir al menos un producto' });

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Upsert cliente
        await client.query(
            `INSERT INTO clientes (nombre, email, telefono, direccion) VALUES ($1,$2,$3,$4)
             ON CONFLICT (email) DO UPDATE SET
               nombre    = EXCLUDED.nombre,
               telefono  = EXCLUDED.telefono,
               direccion = EXCLUDED.direccion`,
            [cliente.nombre, cliente.email, cliente.telefono || null, cliente.direccion || null]
        );
        const { rows: [clienteRow] } = await client.query(
            'SELECT id FROM clientes WHERE email = $1', [cliente.email]
        );

        // Verificar stock y calcular total
        let total = 0;
        const lineas = [];
        for (const item of items) {
            const { rows: [prod] } = await client.query(
                'SELECT id, precio, stock, nombre FROM productos WHERE id = $1 AND activo = true FOR UPDATE',
                [item.producto_id]
            );
            if (!prod) throw new Error(`Producto ${item.producto_id} no encontrado o inactivo`);
            if (prod.stock < item.cantidad) throw new Error(`Stock insuficiente para "${prod.nombre}" (disponible: ${prod.stock})`);
            total += Number(prod.precio) * item.cantidad;
            lineas.push({ ...item, precio_unit: prod.precio });
        }

        // Crear cabecera del pedido
        const { rows: [pedidoRow] } = await client.query(
            `INSERT INTO pedidos (cliente_id, total, direccion_envio, notas)
             VALUES ($1,$2,$3,$4) RETURNING id`,
            [clienteRow.id, total, direccion_envio || null, notas || null]
        );
        const pedidoId = pedidoRow.id;

        // Insertar líneas y descontar stock
        for (const l of lineas) {
            await client.query(
                `INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unit, subtotal)
                 VALUES ($1,$2,$3,$4,$5)`,
                [pedidoId, l.producto_id, l.cantidad, l.precio_unit, Number(l.precio_unit) * l.cantidad]
            );
            await client.query(
                'UPDATE productos SET stock = stock - $1, actualizado_en = NOW() WHERE id = $2',
                [l.cantidad, l.producto_id]
            );
            await client.query(
                `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo)
                 VALUES ($1,'salida',$2,$3)`,
                [l.producto_id, l.cantidad, `Pedido #${pedidoId}`]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Pedido creado exitosamente', pedidoId, total });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
});

// GET /api/pedidos/:id
router.get('/:id', async (req, res) => {
    try {
        const db = await getDb();
        const { rows: [pedido] } = await db.query(
            `SELECT p.*, cl.nombre AS cliente_nombre, cl.email AS cliente_email
             FROM pedidos p JOIN clientes cl ON p.cliente_id = cl.id
             WHERE p.id = $1`,
            [req.params.id]
        );
        if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
        const { rows: lineas } = await db.query(
            `SELECT dp.*, pr.nombre AS producto_nombre
             FROM detalle_pedidos dp JOIN productos pr ON dp.producto_id = pr.id
             WHERE dp.pedido_id = $1`,
            [req.params.id]
        );
        res.json({ ...pedido, lineas });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/pedidos/:id/estado
router.patch('/:id/estado', async (req, res) => {
    try {
        const db = await getDb();
        const { estado } = req.body;
        const validos = ['pendiente','confirmado','enviado','entregado','cancelado'];
        if (!validos.includes(estado)) return res.status(400).json({ error: 'Estado inválido' });
        await db.query(
            'UPDATE pedidos SET estado = $1, actualizado_en = NOW() WHERE id = $2',
            [estado, req.params.id]
        );
        res.json({ message: 'Estado actualizado' });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
