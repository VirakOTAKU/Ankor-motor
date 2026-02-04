const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'cars.db');
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run('DROP TABLE IF EXISTS cars');
  db.run(
    `CREATE TABLE cars (
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
    )`
  );

  const stmt = db.prepare(
    'INSERT INTO cars (name, brand, model, category, year, bodyType, transmission, condition, mileage, color, price, description, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  // Sample rows
  stmt.run(
    'Toyota Corolla',
    'Toyota',
    'Corolla',
    'Sedan',
    2018,
    'Sedan',
    'Automatic',
    'Used',
    45000,
    'White',
    12000,
    'Reliable compact sedan',
    'images/placeholder.png'
  );

  stmt.run(
    'Honda Civic',
    'Honda',
    'Civic',
    'Sedan',
    2019,
    'Sedan',
    'Manual',
    'Used',
    38000,
    'Blue',
    14000,
    'Sporty and efficient',
    'images/placeholder.png'
  );

  stmt.run(
    'Ford Ranger',
    'Ford',
    'Ranger',
    'Truck',
    2020,
    'Pickup',
    'Automatic',
    'Used',
    60000,
    'Black',
    22000,
    'Reliable pickup for work',
    'images/placeholder.png'
  );

  stmt.finalize();
  console.log('Seeded cars.db with sample data at', DB_PATH);
});

db.close();
