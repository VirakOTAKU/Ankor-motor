const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const CARS_DB_PATH = path.join(__dirname, 'cars.db');

const carsData = [
  {
    "car_name": "Toyota Camry LE",
    "model": "Camry",
    "brand": "Toyota",
    "category": "Sedan",
    "year": 2019,
    "body_type": "Sedan",
    "transmission": "Automatic",
    "condition": "Used",
    "mileage_km": 72000,
    "color": "Silver",
    "price_usd": 18000,
    "image_url": "https://example.com/images/toyota_camry_2019.jpg",
    "description": "Reliable mid-size sedan with comfortable interior, good fuel economy and a clean service history. Ideal for daily commuting and family use."
  },
  {
    "car_name": "Honda Civic EX",
    "model": "Civic",
    "brand": "Honda",
    "category": "Sedan",
    "year": 2018,
    "body_type": "Sedan",
    "transmission": "CVT",
    "condition": "Used",
    "mileage_km": 65000,
    "color": "Red",
    "price_usd": 15000,
    "image_url": "https://example.com/images/honda_civic_2018.jpg",
    "description": "Sporty compact sedan with a rev-happy engine, excellent reliability, and good fuel efficiency. Well-maintained and single-owner."
  },
  {
    "car_name": "Nissan X-Trail ST",
    "model": "X-Trail",
    "brand": "Nissan",
    "category": "SUV",
    "year": 2020,
    "body_type": "SUV",
    "transmission": "Automatic",
    "condition": "Used",
    "mileage_km": 43000,
    "color": "White",
    "price_usd": 22000,
    "image_url": "https://example.com/images/nissan_xtrail_2020.jpg",
    "description": "A practical 5-seater SUV offering spacious cabin, good cargo space and smooth ride quality. Great for families and road trips."
  },
  {
    "car_name": "Mitsubishi Pajero Sport GLS",
    "model": "Pajero Sport",
    "brand": "Mitsubishi",
    "category": "SUV",
    "year": 2017,
    "body_type": "SUV",
    "transmission": "Automatic",
    "condition": "Used",
    "mileage_km": 98000,
    "color": "Black",
    "price_usd": 16500,
    "image_url": "https://example.com/images/mitsubishi_pajero_2017.jpg",
    "description": "Rugged SUV with strong diesel engine, high ground clearance and good towing capability. Maintained for off-road and long-distance travel."
  },
  {
    "car_name": "Ford Ranger XLT",
    "model": "Ranger",
    "brand": "Ford",
    "category": "Pickup",
    "year": 2016,
    "body_type": "Pickup",
    "transmission": "Automatic",
    "condition": "Used",
    "mileage_km": 120000,
    "color": "Blue",
    "price_usd": 19000,
    "image_url": "https://example.com/images/ford_ranger_2016.jpg",
    "description": "Durable pickup with strong torque, ideal for utility and commercial use. Well-kept and regularly serviced."
  },
  {
    "car_name": "BMW 3 Series 320i",
    "model": "3 Series",
    "brand": "BMW",
    "category": "Sedan",
    "year": 2015,
    "body_type": "Sedan",
    "transmission": "Automatic",
    "condition": "Used",
    "mileage_km": 90000,
    "color": "Grey",
    "price_usd": 17000,
    "image_url": "https://example.com/images/bmw_320i_2015.jpg",
    "description": "Compact executive sedan with balanced handling and a premium interior. Good value for buyers seeking luxury on a budget."
  },
  {
    "car_name": "Mercedes-Benz C200",
    "model": "C-Class",
    "brand": "Mercedes-Benz",
    "category": "Sedan",
    "year": 2014,
    "body_type": "Sedan",
    "transmission": "Automatic",
    "condition": "Used",
    "mileage_km": 110000,
    "color": "Black",
    "price_usd": 19500,
    "image_url": "https://example.com/images/mercedes_c200_2014.jpg",
    "description": "Comfortable luxury sedan with premium features and a smooth ride. Recent service and new tires installed."
  },
  {
    "car_name": "Audi A4 1.8T",
    "model": "A4",
    "brand": "Audi",
    "category": "Sedan",
    "year": 2013,
    "body_type": "Sedan",
    "transmission": "Automatic",
    "condition": "Used",
    "mileage_km": 130000,
    "color": "Silver",
    "price_usd": 14000,
    "image_url": "https://example.com/images/audi_a4_2013.jpg",
    "description": "Premium compact sedan combining solid performance with a refined interior. Priced to sell and mechanically sound."
  },
  {
    "car_name": "Lexus RX 350",
    "model": "RX 350",
    "brand": "Lexus",
    "category": "SUV",
    "year": 2016,
    "body_type": "SUV",
    "transmission": "Automatic",
    "condition": "Used",
    "mileage_km": 75000,
    "color": "Pearl White",
    "price_usd": 28500,
    "image_url": "https://example.com/images/lexus_rx_2016.jpg",
    "description": "Luxury crossover with comfortable ride, quiet cabin and strong reliability record. Ideal for comfort-oriented buyers."
  },
  {
    "car_name": "Hyundai Tucson GLS",
    "model": "Tucson",
    "brand": "Hyundai",
    "category": "SUV",
    "year": 2019,
    "body_type": "SUV",
    "transmission": "Automatic",
    "condition": "Used",
    "mileage_km": 52000,
    "color": "Brown",
    "price_usd": 17000,
    "image_url": "https://example.com/images/hyundai_tucson_2019.jpg",
    "description": "Well-equipped crossover with modern infotainment and comfortable seating. Great value with low kilometers."
  },
  {
    "car_name": "Kia Picanto LX",
    "model": "Picanto",
    "brand": "Kia",
    "category": "Hatchback",
    "year": 2020,
    "body_type": "Hatchback",
    "transmission": "Automatic",
    "condition": "Used",
    "mileage_km": 28000,
    "color": "Yellow",
    "price_usd": 9000,
    "image_url": "https://example.com/images/kia_picanto_2020.jpg",
    "description": "Compact city car that's easy to park and economical to run. Recent inspection and excellent fuel economy."
  },
  {
    "car_name": "Mazda CX-5 Sport",
    "model": "CX-5",
    "brand": "Mazda",
    "category": "SUV",
    "year": 2018,
    "body_type": "SUV",
    "transmission": "Automatic",
    "condition": "Used",
    "mileage_km": 67000,
    "color": "Soul Red",
    "price_usd": 19000,
    "image_url": "https://example.com/images/mazda_cx5_2018.jpg",
    "description": "Stylish crossover with sharp handling and efficient engine. Clean interior and full service history available."
  },
  {
    "car_name": "Subaru Forester 2.0i",
    "model": "Forester",
    "brand": "Subaru",
    "category": "SUV",
    "year": 2017,
    "body_type": "SUV",
    "transmission": "CVT",
    "condition": "Used",
    "mileage_km": 82000,
    "color": "Green",
    "price_usd": 16000,
    "image_url": "https://example.com/images/subaru_forester_2017.jpg",
    "description": "Reliable AWD SUV with excellent safety features and roomy cabin. Perfect for all-weather driving."
  },
  {
    "car_name": "Suzuki Swift GL",
    "model": "Swift",
    "brand": "Suzuki",
    "category": "Hatchback",
    "year": 2015,
    "body_type": "Hatchback",
    "transmission": "Manual",
    "condition": "Used",
    "mileage_km": 98000,
    "color": "Blue",
    "price_usd": 7000,
    "image_url": "https://example.com/images/suzuki_swift_2015.jpg",
    "description": "Economical and nimble hatchback, easy to maintain and cheap to insure. Good for urban driving and learners."
  },
  {
    "car_name": "Isuzu D-Max LS",
    "model": "D-Max",
    "brand": "Isuzu",
    "category": "Pickup",
    "year": 2021,
    "body_type": "Pickup",
    "transmission": "Automatic",
    "condition": "Used",
    "mileage_km": 30000,
    "color": "White",
    "price_usd": 27000,
    "image_url": "https://example.com/images/isuzu_dmax_2021.jpg",
    "description": "Modern pickup with reliable diesel engine and strong payload capacity. Suitable for business and personal use."
  },
  {
    "car_name": "Chevrolet Colorado LT",
    "model": "Colorado",
    "brand": "Chevrolet",
    "category": "Pickup",
    "year": 2018,
    "body_type": "Pickup",
    "transmission": "Automatic",
    "condition": "Used",
    "mileage_km": 90000,
    "color": "Grey",
    "price_usd": 15500,
    "image_url": "https://example.com/images/chevrolet_colorado_2018.jpg",
    "description": "Capable pickup with towing ability and spacious bed. Good maintenance record and recently replaced brakes."
  },
  {
    "car_name": "Volkswagen Golf GTI",
    "model": "Golf",
    "brand": "Volkswagen",
    "category": "Hatchback",
    "year": 2014,
    "body_type": "Hatchback",
    "transmission": "Manual",
    "condition": "Used",
    "mileage_km": 140000,
    "color": "White",
    "price_usd": 12000,
    "image_url": "https://example.com/images/vw_golf_gti_2014.jpg",
    "description": "Hot hatch with peppy turbo engine and sporty handling. Enthusiast-owned and well-serviced."
  },
  {
    "car_name": "Peugeot 3008 Allure",
    "model": "3008",
    "brand": "Peugeot",
    "category": "SUV",
    "year": 2019,
    "body_type": "SUV",
    "transmission": "Automatic",
    "condition": "Used",
    "mileage_km": 48000,
    "color": "Blue",
    "price_usd": 20000,
    "image_url": "https://example.com/images/peugeot_3008_2019.jpg",
    "description": "Stylish compact SUV with modern interior and comfortable ride. Excellent condition and lightly used."
  },
  {
    "car_name": "Renault Koleos Expression",
    "model": "Koleos",
    "brand": "Renault",
    "category": "SUV",
    "year": 2017,
    "body_type": "SUV",
    "transmission": "Automatic",
    "condition": "Used",
    "mileage_km": 76000,
    "color": "Silver",
    "price_usd": 14800,
    "image_url": "https://example.com/images/renault_koleos_2017.jpg",
    "description": "Comfortable European SUV with roomy rear seats and smooth highway manners. Serviced locally and ready to go."
  },
  {
    "car_name": "Land Rover Discovery Sport",
    "model": "Discovery Sport",
    "brand": "Land Rover",
    "category": "SUV",
    "year": 2016,
    "body_type": "SUV",
    "transmission": "Automatic",
    "condition": "Used",
    "mileage_km": 115000,
    "color": "Black",
    "price_usd": 23500,
    "image_url": "https://example.com/images/lr_discovery_2016.jpg",
    "description": "Premium compact SUV with strong off-road capability and a luxurious cabin. Well-equipped and solid condition."
  },
  {
    "car_name": "Jeep Wrangler Sport",
    "model": "Wrangler",
    "brand": "Jeep",
    "category": "SUV",
    "year": 2013,
    "body_type": "Convertible SUV",
    "transmission": "Manual",
    "condition": "Used",
    "mileage_km": 160000,
    "color": "Olive",
    "price_usd": 21000,
    "image_url": "https://example.com/images/jeep_wrangler_2013.jpg",
    "description": "Iconic off-roader with removable top and excellent trail capability. Mechanically sound with recent service."
  },
  {
    "car_name": "Dodge Charger SXT",
    "model": "Charger",
    "brand": "Dodge",
    "category": "Sedan",
    "year": 2015,
    "body_type": "Sedan",
    "transmission": "Automatic",
    "condition": "Used",
    "mileage_km": 125000,
    "color": "Black",
    "price_usd": 14000,
    "image_url": "https://example.com/images/dodge_charger_2015.jpg",
    "description": "Full-size sedan with V6 power and spacious interior. Great for buyers wanting American muscle styling with comfort."
  },
  {
    "car_name": "RAM 1500 Laramie",
    "model": "1500",
    "brand": "RAM",
    "category": "Pickup",
    "year": 2019,
    "body_type": "Pickup",
    "transmission": "Automatic",
    "condition": "Used",
    "mileage_km": 64000,
    "color": "Silver",
    "price_usd": 32000,
    "image_url": "https://example.com/images/ram_1500_2019.jpg",
    "description": "Luxury-oriented full-size pickup with powerful engine, roomy cabin and advanced features. Excellent condition."
  },
  {
    "car_name": "Tesla Model S 75",
    "model": "Model S",
    "brand": "Tesla",
    "category": "Sedan",
    "year": 2016,
    "body_type": "Sedan",
    "transmission": "Automatic (Electric)",
    "condition": "Used",
    "mileage_km": 90000,
    "color": "White",
    "price_usd": 35000,
    "image_url": "https://example.com/images/tesla_model_s_2016.jpg",
    "description": "Electric luxury sedan with excellent acceleration and long-range battery. Well-maintained and includes charging accessories."
  },
  {
    "car_name": "Volvo XC60 Momentum",
    "model": "XC60",
    "brand": "Volvo",
    "category": "SUV",
    "year": 2018,
    "body_type": "SUV",
    "transmission": "Automatic",
    "condition": "Used",
    "mileage_km": 58000,
    "color": "Blue",
    "price_usd": 24000,
    "image_url": "https://example.com/images/volvo_xc60_2018.jpg",
    "description": "Safety-focused crossover with plush interior and balanced ride. Full-service records and minor wear only."
  },
  {
    "car_name": "Fiat 500 Pop",
    "model": "500",
    "brand": "Fiat",
    "category": "Hatchback",
    "year": 2013,
    "body_type": "Hatchback",
    "transmission": "Automatic",
    "condition": "Used",
    "mileage_km": 102000,
    "color": "Red",
    "price_usd": 6500,
    "image_url": "https://example.com/images/fiat_500_2013.jpg",
    "description": "Cute and compact city car with charming styling. Perfect for single commuters or as a second car."
  },
  {
    "car_name": "MINI Cooper S",
    "model": "Cooper",
    "brand": "MINI",
    "category": "Hatchback",
    "year": 2017,
    "body_type": "Hatchback",
    "transmission": "Automatic",
    "condition": "Used",
    "mileage_km": 54000,
    "color": "British Racing Green",
    "price_usd": 16000,
    "image_url": "https://example.com/images/mini_cooper_2017.jpg",
    "description": "Fun-to-drive small hatch with punchy engine and premium cabin. Nicely kept and great for city driving."
  },
  {
    "car_name": "Acura RDX Technology",
    "model": "RDX",
    "brand": "Acura",
    "category": "SUV",
    "year": 2019,
    "body_type": "SUV",
    "transmission": "Automatic",
    "condition": "Used",
    "mileage_km": 48000,
    "color": "Grey",
    "price_usd": 26000,
    "image_url": "https://example.com/images/acura_rdx_2019.jpg",
    "description": "Sporty luxury crossover with turbo engine and well-equipped interior. Clean history and recent maintenance done."
  },
  {
    "car_name": "Infiniti Q50 Luxe",
    "model": "Q50",
    "brand": "Infiniti",
    "category": "Sedan",
    "year": 2016,
    "body_type": "Sedan",
    "transmission": "Automatic",
    "condition": "Used",
    "mileage_km": 89000,
    "color": "Black",
    "price_usd": 15500,
    "image_url": "https://example.com/images/infiniti_q50_2016.jpg",
    "description": "Luxury sedan with strong V6 performance and comfortable ride. Good value for those seeking refinement at a lower price."
  },
  {
    "car_name": "Cadillac ATS 2.0T",
    "model": "ATS",
    "brand": "Cadillac",
    "category": "Sedan",
    "year": 2015,
    "body_type": "Sedan",
    "transmission": "Automatic",
    "condition": "Used",
    "mileage_km": 115000,
    "color": "White",
    "price_usd": 12000,
    "image_url": "https://example.com/images/cadillac_ats_2015.jpg",
    "description": "European-inspired American compact executive sedan with sporty handling. Well-maintained with recent tune-up."
  },
  {
    "car_name": "Porsche Cayman S",
    "model": "Cayman",
    "brand": "Porsche",
    "category": "Coupe",
    "year": 2012,
    "body_type": "Coupe",
    "transmission": "Manual",
    "condition": "Used",
    "mileage_km": 98000,
    "color": "Silver",
    "price_usd": 42000,
    "image_url": "https://example.com/images/porsche_cayman_2012.jpg",
    "description": "Driver-focused sports coupe with crisp handling and strong flat-six power. Performance-oriented maintenance documented."
  },
  {
    "car_name": "Bentley Continental GT",
    "model": "Continental GT",
    "brand": "Bentley",
    "category": "Coupe",
    "year": 2011,
    "body_type": "Coupe",
    "transmission": "Automatic",
    "condition": "Used",
    "mileage_km": 95000,
    "color": "Black",
    "price_usd": 85000,
    "image_url": "https://example.com/images/bentley_continental_2011.jpg",
    "description": "Ultra-luxury grand tourer with handcrafted interior and powerful engine. Excellent condition for a luxury classic."
  }
];

const db = new sqlite3.Database(CARS_DB_PATH, (err) => {
  if (err) {
    console.error('Failed to open DB:', err.message);
    process.exit(1);
  }
  console.log('Connected to cars DB');

  // Insert all cars
  let insertedCount = 0;
  const stmt = db.prepare(
    `INSERT INTO cars (name, brand, model, category, year, bodyType, transmission, condition, mileage, color, price, description, image)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  carsData.forEach((car) => {
    stmt.run(
      car.car_name,
      car.brand,
      car.model,
      car.category,
      car.year,
      car.body_type,
      car.transmission,
      car.condition,
      car.mileage_km,
      car.color,
      car.price_usd,
      car.description,
      car.image_url,
      function(err) {
        if (err) {
          console.error(`Error inserting ${car.car_name}:`, err.message);
        } else {
          insertedCount++;
          console.log(`✓ Added ${car.car_name} (${insertedCount}/${carsData.length})`);
        }
      }
    );
  });

  stmt.finalize((err) => {
    if (err) console.error('Error finalizing:', err.message);
    db.close(() => {
      console.log(`\n✓ Done! Added ${insertedCount} cars to database`);
      process.exit(0);
    });
  });
});
