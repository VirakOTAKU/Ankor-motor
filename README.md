# Angkor Auto - E-Commerce Platform

A full-featured car e-commerce website with SQLite backend and admin dashboard for managing inventory.

## Features

✅ **Car Inventory Management**
- View all available cars with detailed specifications
- Filter by brand and category
- Click to view car details and place orders

✅ **Admin Dashboard**
- **User Management** — Add, edit, delete users with role-based access
- **Orders Management** — View and manage customer orders
- **Car Management** — Add new cars with image URLs or file uploads
- **Edit Cars** — Update existing car details, price, specs, images
- **Delete Cars** — Remove cars from inventory
- **Messages** — View and manage contact messages

✅ **User Authentication**
- Customer and Admin roles
- Profile management
- Order history tracking

✅ **Database**
- SQLite backend (`cars.db`)
- Persistent data storage
- Easy seeding with sample data

## Setup & Installation

### Prerequisites
- Node.js 16+ ([Download](https://nodejs.org))
- Git

### Installation Steps

1. **Clone the repository:**
```bash
git clone https://github.com/YOUR_USERNAME/angkor-auto.git
cd angkor-auto
```

2. **Install dependencies:**
```bash
npm install
```

3. **Seed the database with sample cars:**
```bash
npm run seed
```

4. **Start the server:**
```bash
npm start
```

5. **Open in browser:**
```
http://localhost:3000
```

## Default Login

**Admin Account:**
- Username: `admin`
- Password: `admin`

## Project Structure

```
.
├── index.html              # Main homepage
├── cars.html              # Cars listing page
├── main.js                # Frontend logic & admin dashboard
├── main.css               # Styling
├── server.js              # Express backend server
├── seed_db.js             # Database seeding script
├── package.json           # Dependencies
├── cars.db                # SQLite database (auto-created)
├── images/                # Car images folder
└── videos/                # Videos folder
```

## API Endpoints

### GET /api/cars
Get all cars from inventory
```bash
curl http://localhost:3000/api/cars
```

### POST /api/cars
Add a new car (admin only)
```bash
curl -X POST http://localhost:3000/api/cars \
  -H "Content-Type: application/json" \
  -d '{"name":"Toyota Camry","brand":"Toyota","price":25000,...}'
```

### PUT /api/cars/:id
Update a car
```bash
curl -X PUT http://localhost:3000/api/cars/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Honda Civic","price":22000,...}'
```

### DELETE /api/cars/:id
Delete a car
```bash
curl -X DELETE http://localhost:3000/api/cars/1
```

## Adding Car Images

Two methods:

**Method 1: Image URL**
- In Admin Dashboard → Add Cars → Enter image URL
- e.g., `https://example.com/car-image.jpg`

**Method 2: File Upload**
- Upload from your computer
- Stored as base64 in database

## Deployment

### Heroku
```bash
heroku login
heroku create your-app-name
git push heroku main
```

### Local Server
Keep `npm start` running on your server machine.

## Tech Stack

- **Frontend:** HTML5, CSS3, Bootstrap 5, JavaScript (Vanilla)
- **Backend:** Node.js, Express.js
- **Database:** SQLite3
- **Icons:** Bootstrap Icons

## License

MIT License - feel free to use for your project!

## Support

For issues or questions, open an issue on GitHub.

