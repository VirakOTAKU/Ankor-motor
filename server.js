const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
// Separate DBs: cars.db for cars, app.db for users/messages
const CARS_DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'cars.db');
const APP_DB_PATH = process.env.APP_DATABASE_PATH || path.join(__dirname, 'app.db');

app.use(cors({ origin: process.env.API_CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Global DB instances
let db = null; // cars DB
let appDb = null; // users/messages DB
let dbReady = false;

// Initialize both databases
function initDB() {
  return new Promise((resolve, reject) => {
    // Open cars DB
    db = new sqlite3.Database(CARS_DB_PATH, (err) => {
      if (err) {
        console.error('Failed to open cars DB:', err.message);
        reject(err);
        return;
      }
      console.log('Connected to cars SQLite DB at', CARS_DB_PATH);
      
      // Create cars table
      db.run(
        `CREATE TABLE IF NOT EXISTS cars (
          id INTEGER PRIMARY KEY,
          name TEXT,
          brand TEXT,
          model TEXT,
          category TEXT,
          year INTEGER,
          bodyType TEXT,
          transmission TEXT,
          condition TEXT,
          mileage INTEGER,
          color TEXT,
          price INTEGER,
          description TEXT,
          image TEXT
        )`,
        (err) => {
          if (err) {
            console.error('Failed to create cars table:', err.message);
            reject(err);
            return;
          }
          
          // Check if cars table is empty and seed if needed
          db.get('SELECT COUNT(*) AS cnt FROM cars', (err, row) => {
            if (err) {
              console.error('Failed to count cars:', err.message);
              reject(err);
              return;
            }
            
            const carsCnt = row ? row.cnt : 0;
            if (carsCnt === 0) {
              console.log('Seeding default cars...');
              const stmt = db.prepare(
                'INSERT INTO cars (name, brand, model, category, year, bodyType, transmission, condition, mileage, color, price, description, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
              );
              stmt.run('Toyota Corolla', 'Toyota', 'Corolla', 'Sedan', 2018, 'Sedan', 'Automatic', 'Used', 45000, 'White', 12000, 'Reliable compact sedan', 'images/placeholder.png');
              stmt.run('Honda Civic', 'Honda', 'Civic', 'Sedan', 2019, 'Sedan', 'Manual', 'Used', 38000, 'Blue', 14000, 'Sporty and efficient', 'images/placeholder.png');
              stmt.run('Ford Ranger', 'Ford', 'Ranger', 'Truck', 2020, 'Pickup', 'Automatic', 'Used', 60000, 'Black', 22000, 'Reliable pickup for work', 'images/placeholder.png');
              stmt.finalize();
            }
            
            // Now open app DB for users/messages
            appDb = new sqlite3.Database(APP_DB_PATH, (err) => {
              if (err) {
                console.error('Failed to open app DB:', err.message);
                reject(err);
                return;
              }
              console.log('Connected to app SQLite DB at', APP_DB_PATH);
              
              // Create users table
              appDb.run(
                `CREATE TABLE IF NOT EXISTS users (
                  username TEXT PRIMARY KEY,
                  email TEXT,
                  password TEXT,
                  role TEXT,
                  avatar TEXT
                )`,
                (err) => {
                  if (err) {
                    console.error('Failed to create users table:', err.message);
                    reject(err);
                    return;
                  }
                  
                  // Create messages table
                  appDb.run(
                    `CREATE TABLE IF NOT EXISTS messages (
                      id INTEGER PRIMARY KEY,
                      user TEXT,
                      email TEXT,
                      message TEXT,
                      date TEXT
                    )`,
                    (err) => {
                      if (err) {
                        console.error('Failed to create messages table:', err.message);
                        reject(err);
                        return;
                      }
                      
                      // Seed default users if empty
                      appDb.get('SELECT COUNT(*) AS cnt FROM users', (err, row) => {
                        if (err) {
                          console.error('Failed to count users:', err.message);
                          reject(err);
                          return;
                        }
                        
                        const usersCnt = row ? row.cnt : 0;
                        if (usersCnt === 0) {
                          console.log('Seeding default users...');
                          const usersStmt = appDb.prepare('INSERT INTO users (username, email, password, role, avatar) VALUES (?, ?, ?, ?, ?)');
                          usersStmt.run('admin', 'admin@angkorauto.com', 'admin', 'admin', null);
                          usersStmt.run('demo', 'demo@example.com', 'demo', 'customer', null);
                          usersStmt.finalize();
                        }
                        
                        // Seed default message if empty
                        appDb.get('SELECT COUNT(*) AS cnt FROM messages', (err, row) => {
                          if (err) {
                            console.error('Failed to count messages:', err.message);
                            reject(err);
                            return;
                          }
                          
                          const msgsCnt = row ? row.cnt : 0;
                          if (msgsCnt === 0) {
                            console.log('Seeding default message...');
                            const msgsStmt = appDb.prepare('INSERT INTO messages (user, email, message, date) VALUES (?, ?, ?, ?)');
                            msgsStmt.run('Demo User', 'demo@example.com', 'Hello from seeded DB', new Date().toLocaleDateString());
                            msgsStmt.finalize();
                          }
                          
                          console.log('Databases initialized successfully');
                          dbReady = true;
                          resolve();
                        });
                      });
                    }
                  );
                }
              );
            });
          });
        }
      );
    });
  });
}

// Create users and messages tables (for global persistence)
function ensureUsersAndMessages() {
  // Tables already created in initDB()
}

// Users endpoints
app.get('/api/users', (req, res) => {
  if (!dbReady) return res.status(503).json({ error: 'Database not ready' });
  appDb.all('SELECT username, email, role, avatar FROM users', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/users', (req, res) => {
  if (!dbReady) return res.status(503).json({ error: 'Database not ready' });
  const { username, email, password, role, avatar } = req.body;
  console.log(`[${new Date().toISOString()}] POST /api/users: ${username}`);
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const stmt = appDb.prepare('INSERT OR IGNORE INTO users (username, email, password, role, avatar) VALUES (?, ?, ?, ?, ?)');
  stmt.run(username, email || null, password, role || 'customer', avatar || null, function(err) {
    if (err) {
      console.error(`Error inserting user ${username}:`, err.message);
      return res.status(500).json({ error: err.message });
    }
    const created = this.changes && this.changes > 0;
    console.log(`User ${username} created: ${created}`);
    res.json({ username, email, role, avatar, created });
  });
  stmt.finalize();
});

// Update a user
app.put('/api/users/:username', (req, res) => {
  if (!dbReady) return res.status(503).json({ error: 'Database not ready' });
  const { username } = req.params;
  const { email, role, password, avatar, newUsername } = req.body;
  const updates = [];
  const params = [];
  if (newUsername) { updates.push('username = ?'); params.push(newUsername); }
  if (email !== undefined) { updates.push('email = ?'); params.push(email); }
  if (role !== undefined) { updates.push('role = ?'); params.push(role); }
  if (password !== undefined) { updates.push('password = ?'); params.push(password); }
  if (avatar !== undefined) { updates.push('avatar = ?'); params.push(avatar); }
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
  params.push(username);
  const sql = `UPDATE users SET ${updates.join(', ')} WHERE username = ?`;
  const stmt = appDb.prepare(sql);
  stmt.run(...params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
  stmt.finalize();
});

// Delete a user
app.delete('/api/users/:username', (req, res) => {
  if (!dbReady) return res.status(503).json({ error: 'Database not ready' });
  const { username } = req.params;
  const stmt = appDb.prepare('DELETE FROM users WHERE username = ?');
  stmt.run(username, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deleted: this.changes });
  });
  stmt.finalize();
});

// Messages endpoints
app.get('/api/messages', (req, res) => {
  if (!dbReady) return res.status(503).json({ error: 'Database not ready' });
  appDb.all('SELECT id, user, email, message, date FROM messages ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/messages', (req, res) => {
  if (!dbReady) return res.status(503).json({ error: 'Database not ready' });
  const { user, email, message, date } = req.body;
  if (!user || !email || !message) return res.status(400).json({ error: 'Missing fields' });
  const stmt = appDb.prepare('INSERT INTO messages (user, email, message, date) VALUES (?, ?, ?, ?)');
  stmt.run(user, email, message, date || new Date().toLocaleDateString(), function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, user, email, message, date });
  });
  stmt.finalize();
});

// Delete message by id
app.delete('/api/messages/:id', (req, res) => {
  if (!dbReady) return res.status(503).json({ error: 'Database not ready' });
  const { id } = req.params;
  const stmt = appDb.prepare('DELETE FROM messages WHERE id = ?');
  stmt.run(id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id: parseInt(id) });
  });
  stmt.finalize();
});

// API: list cars
app.get('/api/cars', (req, res) => {
  if (!dbReady) return res.status(503).json({ error: 'Database not ready' });
  
  db.all('SELECT * FROM cars ORDER BY id ASC', (err, rows) => {
    if (err) {
      console.error('DB error reading cars:', err.message);
      return res.status(500).json({ error: err.message });
    }
    const cars = (rows || []).map((r) => ({
      id: r.id,
      name: r.name,
      brand: r.brand,
      model: r.model,
      category: r.category,
      year: r.year,
      bodyType: r.bodyType,
      transmission: r.transmission,
      condition: r.condition,
      mileage: r.mileage,
      color: r.color,
      price: r.price,
      description: r.description,
      image: r.image || 'images/placeholder.png'
    }));
    res.json(cars);
  });
});

// API: add car
app.post('/api/cars', (req, res) => {
  if (!dbReady) return res.status(503).json({ error: 'Database not ready' });
  
  const { name, brand, model, category, year, bodyType, transmission, condition, mileage, color, price, description, image } = req.body;
  const stmt = db.prepare(
    'INSERT INTO cars (name, brand, model, category, year, bodyType, transmission, condition, mileage, color, price, description, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  stmt.run(name, brand, model, category, year, bodyType, transmission, condition, mileage, color, price, description, image, function(err) {
    if (err) {
      console.error('Insert error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, name, brand, model, category, year, bodyType, transmission, condition, mileage, color, price, description, image });
  });
  stmt.finalize();
});

// API: update car
app.put('/api/cars/:id', (req, res) => {
  if (!dbReady) return res.status(503).json({ error: 'Database not ready' });
  
  const { id } = req.params;
  const { name, brand, model, category, year, bodyType, transmission, condition, mileage, color, price, description, image } = req.body;
  const stmt = db.prepare(
    'UPDATE cars SET name=?, brand=?, model=?, category=?, year=?, bodyType=?, transmission=?, condition=?, mileage=?, color=?, price=?, description=?, image=? WHERE id=?'
  );
  stmt.run(name, brand, model, category, year, bodyType, transmission, condition, mileage, color, price, description, image, id, function(err) {
    if (err) {
      console.error('Update error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: parseInt(id), name, brand, model, category, year, bodyType, transmission, condition, mileage, color, price, description, image });
  });
  stmt.finalize();
});

// API: delete car
app.delete('/api/cars/:id', (req, res) => {
  if (!dbReady) return res.status(503).json({ error: 'Database not ready' });
  
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM cars WHERE id=?');
  stmt.run(id, function(err) {
    if (err) {
      console.error('Delete error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, id: parseInt(id) });
  });
  stmt.finalize();
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', dbReady }));

// Debug endpoint: returns DB info (tables and counts)
app.get('/debug-app', (req, res) => {
  if (!dbReady) return res.status(503).json({ error: 'Database not ready' });
  const info = {};
  db.all("SELECT name, type, sql FROM sqlite_master WHERE type IN ('table','index')", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    info.schema = rows;
    db.get('SELECT COUNT(*) AS cnt FROM users', (err, r1) => {
      if (err) return res.status(500).json({ error: err.message });
      info.usersCount = r1 ? r1.cnt : 0;
      db.get('SELECT COUNT(*) AS cnt FROM messages', (err, r2) => {
        if (err) return res.status(500).json({ error: err.message });
        info.messagesCount = r2 ? r2.cnt : 0;
        // sample rows
        db.all('SELECT username,email,role FROM users LIMIT 20', (err, urows) => {
          if (err) return res.status(500).json({ error: err.message });
          info.users = urows;
          db.all('SELECT id,user,email,message,date FROM messages ORDER BY id DESC LIMIT 20', (err, mrows) => {
            if (err) return res.status(500).json({ error: err.message });
            info.messages = mrows;
            res.json(info);
          });
        });
      });
    });
  });
});

// Start server after DB is ready
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Environment: ${NODE_ENV}`);
      console.log(`✓ DB ready to serve requests\n`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err.message);
    process.exit(1);
  });
