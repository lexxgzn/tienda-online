-- ============================================================
--  TIENDA EN LÍNEA — Esquema PostgreSQL
-- ============================================================

CREATE TABLE IF NOT EXISTS categorias (
    id          SERIAL PRIMARY KEY,
    nombre      TEXT    NOT NULL UNIQUE,
    descripcion TEXT,
    creado_en   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS productos (
    id             SERIAL PRIMARY KEY,
    nombre         TEXT    NOT NULL,
    descripcion    TEXT,
    precio         NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    stock          INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    imagen_url     TEXT,
    categoria_id   INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
    activo         BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en      TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clientes (
    id          SERIAL PRIMARY KEY,
    nombre      TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    telefono    TEXT,
    direccion   TEXT,
    creado_en   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pedidos (
    id              SERIAL PRIMARY KEY,
    cliente_id      INTEGER NOT NULL REFERENCES clientes(id),
    estado          TEXT NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente','confirmado','enviado','entregado','cancelado')),
    total           NUMERIC(10,2) NOT NULL DEFAULT 0,
    direccion_envio TEXT,
    notas           TEXT,
    creado_en       TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS detalle_pedidos (
    id          SERIAL PRIMARY KEY,
    pedido_id   INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id),
    cantidad    INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unit NUMERIC(10,2) NOT NULL CHECK (precio_unit >= 0),
    subtotal    NUMERIC(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS proveedores (
    id        SERIAL PRIMARY KEY,
    nombre    TEXT NOT NULL,
    contacto  TEXT,
    telefono  TEXT,
    email     TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id          SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES productos(id),
    tipo        TEXT NOT NULL CHECK (tipo IN ('entrada','salida','ajuste')),
    cantidad    INTEGER NOT NULL,
    motivo      TEXT,
    proveedor_id INTEGER REFERENCES proveedores(id),
    creado_en   TIMESTAMPTZ DEFAULT NOW()
);

-- Datos de ejemplo (solo si las tablas están vacías)
INSERT INTO categorias (nombre, descripcion)
SELECT * FROM (VALUES
    ('Electrónica',  'Dispositivos y gadgets electrónicos'),
    ('Ropa',         'Prendas de vestir para toda la familia'),
    ('Hogar',        'Artículos para el hogar y decoración'),
    ('Deportes',     'Equipamiento deportivo y fitness'),
    ('Alimentos',    'Productos alimenticios y bebidas')
) AS v(nombre, descripcion)
WHERE NOT EXISTS (SELECT 1 FROM categorias LIMIT 1);

INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id, imagen_url)
SELECT * FROM (VALUES
    ('Auriculares Bluetooth',  'Auriculares inalámbricos con cancelación de ruido', 59.99,  50, 1, 'https://placehold.co/300x300?text=Auriculares'),
    ('Smartphone X12',         'Teléfono 6.5" 128GB cámara 48MP',                  399.99, 30, 1, 'https://placehold.co/300x300?text=Smartphone'),
    ('Camiseta Polo',          'Camiseta polo 100% algodón, varios colores',        19.99, 200, 2, 'https://placehold.co/300x300?text=Camiseta'),
    ('Zapatillas Running',     'Zapatillas ultraligeras suela amortiguada',          89.99,  80, 4, 'https://placehold.co/300x300?text=Zapatillas'),
    ('Lámpara LED',            'Lámpara de escritorio regulable USB-C',             34.99, 120, 3, 'https://placehold.co/300x300?text=Lampara'),
    ('Proteína Whey 1kg',      'Suplemento proteico sabor vainilla',                45.00,  60, 5, 'https://placehold.co/300x300?text=Proteina'),
    ('Teclado Mecánico',       'Teclado TKL switches azules retroiluminado',        79.99,  40, 1, 'https://placehold.co/300x300?text=Teclado'),
    ('Sofá 3 plazas',          'Sofá tapizado en tela antimanchas gris',           499.99,  10, 3, 'https://placehold.co/300x300?text=Sofa')
) AS v(nombre, descripcion, precio, stock, categoria_id, imagen_url)
WHERE NOT EXISTS (SELECT 1 FROM productos LIMIT 1);
