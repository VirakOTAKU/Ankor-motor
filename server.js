const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'cars.db');

app.use(cors({ origin: process.env.API_CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Global DB instance
let db = null;
let dbReady = false;

// Initialize database
function initDB() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Failed to open DB:', err.message);
        reject(err);
        return;
      }
      console.log('Connected to SQLite DB at', DB_PATH);
      
      // Create table
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
          
          // Check if empty and seed
          db.get('SELECT COUNT(*) AS cnt FROM cars', (err, row) => {
            if (err) {
              console.error('Failed to count cars:', err.message);
              reject(err);
              return;
            }
            
            const cnt = row ? row.cnt : 0;
            if (cnt === 0) {
              console.log('Seeding default cars...');
              const stmt = db.prepare(
                'INSERT INTO cars (name, brand, model, category, year, bodyType, transmission, condition, mileage, color, price, description, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
              );
              
              stmt.run('Toyota Corolla', 'Toyota', 'Corolla', 'Sedan', 2018, 'Sedan', 'Automatic', 'Used', 45000, 'White', 12000, 'Reliable compact sedan', 'images/placeholder.png');
              stmt.run('Honda Civic', 'Honda', 'Civic', 'Sedan', 2019, 'Sedan', 'Manual', 'Used', 38000, 'Blue', 14000, 'Sporty and efficient', 'images/placeholder.png');
              stmt.run('Ford Ranger', 'Ford', 'Ranger', 'Truck', 2020, 'Pickup', 'Automatic', 'Used', 60000, 'Black', 22000, 'Reliable pickup for work', 'images/placeholder.png');
              
              stmt.finalize((err) => {
                if (err) {
                  console.error('Failed to seed cars:', err.message);
                  reject(err);
                } else {
                  console.log('Seeded 3 cars successfully');
                  dbReady = true;
                  resolve();
                }
              });
            } else {
              console.log(`Database has ${cnt} cars, ready to serve`);
              dbReady = true;
              resolve();
            }
          });
        }
      );
    });
  });
}

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
