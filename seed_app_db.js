const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'app.db');
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run('DROP TABLE IF EXISTS users');
  db.run('DROP TABLE IF EXISTS messages');

  db.run(`CREATE TABLE users (
    username TEXT PRIMARY KEY,
    email TEXT,
    password TEXT,
    role TEXT,
    avatar TEXT
  )`);

  db.run(`CREATE TABLE messages (
    id INTEGER PRIMARY KEY,
    user TEXT,
    email TEXT,
    message TEXT,
    date TEXT
  )`);

  const u = db.prepare('INSERT INTO users (username, email, password, role, avatar) VALUES (?, ?, ?, ?, ?)');
  u.run('admin', 'admin@angkorauto.com', 'admin', 'admin', null);
  u.run('demo', 'demo@example.com', 'demo', 'customer', null);
  u.finalize();

  const m = db.prepare('INSERT INTO messages (user, email, message, date) VALUES (?, ?, ?, ?)');
  m.run('Demo User', 'demo@example.com', 'Hello from seeded DB', new Date().toLocaleDateString());
  m.finalize();

  console.log('Seeded app.db at', DB_PATH);
});

db.close();
