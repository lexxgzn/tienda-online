-- ============================================================
--  CAFÉ XOLCHILTEPEC — Esquema PostgreSQL v2
-- ============================================================

-- Categorías
CREATE TABLE IF NOT EXISTS categorias (
    id          SERIAL PRIMARY KEY,
    nombre      TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    creado_en   TIMESTAMPTZ DEFAULT NOW()
);

-- Productos
CREATE TABLE IF NOT EXISTS productos (
    id             SERIAL PRIMARY KEY,
    nombre         TEXT NOT NULL,
    descripcion    TEXT,
    precio         NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    stock          INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    imagen_url     TEXT,
    categoria_id   INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
    activo         BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en      TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Servicios ofrecidos por la cafetería
CREATE TABLE IF NOT EXISTS servicios (
    id             SERIAL PRIMARY KEY,
    nombre         TEXT NOT NULL UNIQUE,
    descripcion    TEXT,
    precio_base    NUMERIC(10,2) DEFAULT 0,
    imagen_url     TEXT,
    activo         BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en      TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id          SERIAL PRIMARY KEY,
    nombre      TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    telefono    TEXT,
    direccion   TEXT,
    creado_en   TIMESTAMPTZ DEFAULT NOW()
);

-- Pedidos
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

-- Detalle de pedidos
CREATE TABLE IF NOT EXISTS detalle_pedidos (
    id          SERIAL PRIMARY KEY,
    pedido_id   INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id),
    cantidad    INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unit NUMERIC(10,2) NOT NULL CHECK (precio_unit >= 0),
    subtotal    NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- Proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    id        SERIAL PRIMARY KEY,
    nombre    TEXT NOT NULL,
    contacto  TEXT,
    telefono  TEXT,
    email     TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Movimientos de inventario
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id           SERIAL PRIMARY KEY,
    producto_id  INTEGER NOT NULL REFERENCES productos(id),
    tipo         TEXT NOT NULL CHECK (tipo IN ('entrada','salida','ajuste')),
    cantidad     INTEGER NOT NULL,
    motivo       TEXT,
    proveedor_id INTEGER REFERENCES proveedores(id),
    creado_en    TIMESTAMPTZ DEFAULT NOW()
);

-- Log de acciones del administrador
CREATE TABLE IF NOT EXISTS admin_logs (
    id          SERIAL PRIMARY KEY,
    accion      TEXT NOT NULL,
    entidad     TEXT NOT NULL,
    entidad_id  INTEGER,
    detalle     TEXT,
    creado_en   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DATOS INICIALES
-- ============================================================

-- Categorías
INSERT INTO categorias (nombre, descripcion)
SELECT * FROM (VALUES
    ('Café Molido',  'Café de especialidad molido y listo para preparar'),
    ('Café en Grano','Café en grano para moler al momento'),
    ('Servicios',    'Servicios de procesamiento de café')
) AS v(nombre, descripcion)
WHERE NOT EXISTS (SELECT 1 FROM categorias LIMIT 1);

-- Productos de café
INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id, imagen_url)
SELECT v.nombre, v.descripcion, v.precio::NUMERIC, v.stock::INT, c.id, v.imagen_url
FROM (VALUES
    ('Café Molido 1 kg',
     'Un kilogramo de nuestro café de especialidad recién molido. Perfecto para negocios, oficinas o amantes del café que consumen en cantidad. Tostado artesanalmente en Xolchiltepec.',
     280.00, 50, 'Café Molido',
     'https://placehold.co/400x400/3d1f0d/f5e6c8?text=Café+1kg'),
    ('Café Molido 500 g',
     'Medio kilogramo de café molido artesanal. La medida ideal para el hogar. Aroma intenso, sabor equilibrado con notas a chocolate y caramelo.',
     150.00, 80, 'Café Molido',
     'https://placehold.co/400x400/3d1f0d/f5e6c8?text=Café+500g'),
    ('Café Molido 250 g',
     'Un cuarto de kilogramo para que pruebes nuestro café sin comprometerte con grandes cantidades. Ideal para regalo o para conocer nuestro producto.',
     80.00, 100, 'Café Molido',
     'https://placehold.co/400x400/3d1f0d/f5e6c8?text=Café+250g'),
    ('Café en Grano 1 kg',
     'Un kilogramo de café en grano sin moler. Para los conocedores que prefieren molerlo en casa y disfrutar el aroma fresco en cada preparación.',
     300.00, 30, 'Café en Grano',
     'https://placehold.co/400x400/3d1f0d/f5e6c8?text=Grano+1kg'),
    ('Café en Grano 500 g',
     'Medio kilogramo de café en grano. Tostado artesanalmente, listo para moler y preparar la taza perfecta.',
     160.00, 50, 'Café en Grano',
     'https://placehold.co/400x400/3d1f0d/f5e6c8?text=Grano+500g')
) AS v(nombre, descripcion, precio, stock, categoria_id, imagen_url)
JOIN categorias c ON c.nombre = v.categoria_id
WHERE NOT EXISTS (SELECT 1 FROM productos LIMIT 1);

-- Servicios de procesamiento de café
INSERT INTO servicios (nombre, descripcion, precio_base, imagen_url)
SELECT * FROM (VALUES
    ('Despulpe',
     'El despulpe es el primer paso del procesamiento del café. Consiste en retirar la cáscara exterior (pulpa) del fruto del café para obtener el grano. En Xolchiltepec lo realizamos con máquinas despulpadoras que cuidan la calidad del grano sin dañarlo. Ideal para productores que cosechan su propia cereza de café.',
     15.00,
     'https://placehold.co/400x400/3d1f0d/f5e6c8?text=Despulpe'),
    ('Mortear',
     'El morteado (o descascarado) es el proceso que elimina el pergamino seco que cubre el grano de café después del secado. Es un paso esencial para obtener el café verde listo para tostar. Contamos con equipos que garantizan un morteado limpio y uniforme.',
     20.00,
     'https://placehold.co/400x400/3d1f0d/f5e6c8?text=Mortear'),
    ('Tostar',
     'El tostado es el arte de transformar el café verde en el café que conocemos. Aplicamos calor controlado para desarrollar los azúcares, aceites y aromas del grano. En Xolchiltepec ofrecemos tostados ligero, medio y oscuro según tu preferencia. Un buen tostado marca la diferencia en cada taza.',
     25.00,
     'https://placehold.co/400x400/3d1f0d/f5e6c8?text=Tostar'),
    ('Secado',
     'El secado es la etapa donde el café pergamino o cereza se deshidrata hasta alcanzar el porcentaje de humedad ideal (entre 10% y 12%). Lo hacemos de manera natural bajo el sol en patios o camas africanas, preservando las características propias del café de la región.',
     12.00,
     'https://placehold.co/400x400/3d1f0d/f5e6c8?text=Secado'),
    ('Molienda',
     'Molemos el café a la granulometría (grosor) exacta que necesitas: fina para espresso, media para cafetera de filtro, o gruesa para prensa francesa. Una molienda correcta es clave para extraer todo el sabor del café.',
     18.00,
     'https://placehold.co/400x400/3d1f0d/f5e6c8?text=Molienda'),
    ('Clasificación y Selección',
     'Separamos los granos por tamaño, densidad y color usando zarandas y selección manual. Este proceso elimina granos defectuosos, piedras o materiales ajenos, asegurando que solo el mejor café llegue a tu taza o negocio.',
     22.00,
     'https://placehold.co/400x400/3d1f0d/f5e6c8?text=Clasificacion')
) AS v(nombre, descripcion, precio_base, imagen_url)
WHERE NOT EXISTS (SELECT 1 FROM servicios LIMIT 1);
