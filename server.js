const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static site files (HTML/CSS/JS/images)
app.use(express.static(path.join(__dirname)));

// Open SQLite DB (cars.db in project root)
const DB_PATH = path.join(__dirname, 'cars.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to open DB:', err.message);
  } else {
    console.log('Connected to SQLite DB at', DB_PATH);
  }
});

// API: list cars
app.get('/api/cars', (req, res) => {
  db.all('SELECT * FROM cars ORDER BY id ASC', (err, rows) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    // Convert blob/image stored as base64 to usable URL if needed
    const cars = rows.map((r) => ({
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
  const { name, brand, model, category, year, bodyType, transmission, condition, mileage, color, price, description, image } = req.body;
  const stmt = db.prepare(
    'INSERT INTO cars (name, brand, model, category, year, bodyType, transmission, condition, mileage, color, price, description, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  stmt.run(name, brand, model, category, year, bodyType, transmission, condition, mileage, color, price, description, image, function(err) {
    if (err) {
      console.error('Insert error:', err);
      return res.status(500).json({ error: 'Failed to add car' });
    }
    res.json({ id: this.lastID, name, brand, model, category, year, bodyType, transmission, condition, mileage, color, price, description, image });
  });
  stmt.finalize();
});

// API: update car
app.put('/api/cars/:id', (req, res) => {
  const { id } = req.params;
  const { name, brand, model, category, year, bodyType, transmission, condition, mileage, color, price, description, image } = req.body;
  const stmt = db.prepare(
    'UPDATE cars SET name=?, brand=?, model=?, category=?, year=?, bodyType=?, transmission=?, condition=?, mileage=?, color=?, price=?, description=?, image=? WHERE id=?'
  );
  stmt.run(name, brand, model, category, year, bodyType, transmission, condition, mileage, color, price, description, image, id, function(err) {
    if (err) {
      console.error('Update error:', err);
      return res.status(500).json({ error: 'Failed to update car' });
    }
    res.json({ id: parseInt(id), name, brand, model, category, year, bodyType, transmission, condition, mileage, color, price, description, image });
  });
  stmt.finalize();
});

// API: delete car
app.delete('/api/cars/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM cars WHERE id=?');
  stmt.run(id, function(err) {
    if (err) {
      console.error('Delete error:', err);
      return res.status(500).json({ error: 'Failed to delete car' });
    }
    res.json({ success: true, id: parseInt(id) });
  });
  stmt.finalize();
});

// Basic health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
