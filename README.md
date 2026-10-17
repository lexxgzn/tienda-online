# MiTienda Online 🛍️

Tienda en línea completa con base de datos SQLite, API REST (Node.js + Express) y frontend web.

---

## 🏗️ Estructura del proyecto

```
tienda-online/
├── database/
│   ├── schema.sql       # Esquema completo de la BD
│   └── init.js          # Script para crear la BD manualmente
├── src/
│   └── routes/
│       ├── productos.js  # CRUD de productos
│       ├── categorias.js # CRUD de categorías
│       └── pedidos.js    # Crear y gestionar pedidos
├── public/
│   └── index.html        # Página web de la tienda (frontend completo)
├── src/db.js             # Conexión a SQLite (singleton)
├── server.js             # Punto de entrada del servidor
├── package.json
└── README.md
```

---

## 📦 Base de datos — Tablas

| Tabla                    | Descripción                                  |
|--------------------------|----------------------------------------------|
| `categorias`             | Categorías de productos                      |
| `productos`              | Productos con precio, stock e imagen         |
| `clientes`               | Datos de compradores                         |
| `pedidos`                | Cabecera de cada orden de compra             |
| `detalle_pedidos`        | Líneas de cada pedido (producto + cantidad)  |
| `proveedores`            | Proveedores de productos                     |
| `movimientos_inventario` | Entradas/salidas/ajustes de stock            |

---

## 🚀 Instalación y arranque

### Requisitos previos
- [Node.js v18+](https://nodejs.org/) — descárgalo e instálalo si no lo tienes

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el servidor
npm start
```

> El servidor se inicia en **http://localhost:3000**  
> La base de datos SQLite se crea automáticamente al primer arranque.

---

## 🌐 Página web

Abre tu navegador en `http://localhost:3000` para ver la tienda.

**Funcionalidades de la web:**
- 🔍 Buscador de productos en tiempo real
- 🏷️ Filtro por categoría
- 🛒 Carrito de compras persistente (localStorage)
- 💳 Proceso de checkout con formulario del cliente
- 📦 Descuento automático de stock al confirmar pedido
- ✅ Notificaciones toast

---

## 🔌 API REST

| Método   | Endpoint                    | Descripción                      |
|----------|-----------------------------|----------------------------------|
| `GET`    | `/api/productos`            | Listar productos (con filtros)   |
| `GET`    | `/api/productos/:id`        | Obtener producto por ID          |
| `POST`   | `/api/productos`            | Crear producto                   |
| `PUT`    | `/api/productos/:id`        | Actualizar producto              |
| `DELETE` | `/api/productos/:id`        | Desactivar producto (baja lógica)|
| `GET`    | `/api/categorias`           | Listar categorías                |
| `POST`   | `/api/categorias`           | Crear categoría                  |
| `POST`   | `/api/pedidos`              | Crear pedido completo            |
| `GET`    | `/api/pedidos/:id`          | Ver detalle de un pedido         |
| `PATCH`  | `/api/pedidos/:id/estado`   | Actualizar estado del pedido     |
| `GET`    | `/api/health`               | Estado del servidor              |

### Ejemplo — Crear un pedido via API

```json
POST /api/pedidos
{
  "cliente": {
    "nombre": "María García",
    "email": "maria@ejemplo.com",
    "telefono": "+52 555 000 1111",
    "direccion": "Av. Principal 45, CDMX"
  },
  "items": [
    { "producto_id": 1, "cantidad": 2 },
    { "producto_id": 3, "cantidad": 1 }
  ],
  "direccion_envio": "Av. Principal 45, CDMX",
  "notas": "Entregar por la tarde"
}
```

---

## 🛠️ Desarrollo

```bash
# Modo desarrollo con reinicio automático
npm run dev
```

---

## 📝 Datos de ejemplo incluidos

Al crear la BD se insertan automáticamente:
- **5 categorías**: Electrónica, Ropa, Hogar, Deportes, Alimentos
- **8 productos** de ejemplo con precios y stock
