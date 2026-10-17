const Database = require('better-sqlite3');
const fs       = require('fs');
const path     = require('path');

const DB_PATH  = path.join(__dirname, 'tienda.db');
const SQL_PATH = path.join(__dirname, 'schema.sql');

const db = new Database(DB_PATH);

// Aplicar el esquema SQL al inicializar
const schema = fs.readFileSync(SQL_PATH, 'utf8');
db.exec(schema);

console.log('✅  Base de datos inicializada en:', DB_PATH);
db.close();
