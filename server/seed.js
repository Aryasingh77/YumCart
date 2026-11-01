// seed.js
// Populates MongoDB with the original restaurants and menu items that used
// to be hardcoded in the frontend. Run with: npm run seed

const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Restaurant = require("./models/Restaurant");
const MenuItem = require("./models/MenuItem");

const WM = (file, w) => `https://commons.wikimedia.org/wiki/Special:FilePath/${file}?width=${w || 500}`;

// Exact data from the original yumcart-food-delivery.html
const restaurants = [
  { name: "Punjabi Tadka", cuisine: "Indian", rating: 4.8, time: "25-30 min", img: WM("Chicken_Biryani.jpg") },
  { name: "Bella Napoli", cuisine: "Italian", rating: 4.6, time: "30-35 min", img: WM("Pizza_quasi_Margherita.jpg") },
  { name: "Golden Wok", cuisine: "Chinese", rating: 4.5, time: "20-25 min", img: WM("Kung-pao-shanghai.jpg") },
  { name: "Casa Fiesta", cuisine: "Mexican", rating: 4.4, time: "25-30 min", img: WM("Variety_of_tacos.jpg") },
  { name: "Grill & Bun", cuisine: "American", rating: 4.3, time: "20-30 min", img: WM("Cheeseburger.jpg") },
  { name: "Sweet Ending", cuisine: "Desserts", rating: 4.9, time: "15-20 min", img: WM("Chocolate_lava_cake.jpg") },
  { name: "Green Bowl", cuisine: "Healthy", rating: 4.7, time: "20-25 min", img: WM("Healthy_Gnocchi_Buddha_Bowl.jpg") },
  { name: "Spice Route", cuisine: "Indian", rating: 4.6, time: "25-30 min", img: WM("Punjabi_Dal_Makhani.JPG") },
];

// restaurantName here is used only to look up the created restaurant's _id below;
// it is not stored directly on the MenuItem document.
const menuItems = [
  { name: "Butter Chicken", cuisine: "Indian", type: "nonveg", price: 320, img: WM("Murgh_Makhani.jpg"), desc: "Slow-cooked chicken in a rich tomato-butter gravy, finished with cream.", restaurantName: "Punjabi Tadka" },
  { name: "Paneer Tikka", cuisine: "Indian", type: "veg", price: 260, img: WM("Paneer_tikka.jpg"), desc: "Chargrilled cottage cheese marinated in yogurt and spices.", restaurantName: "Punjabi Tadka" },
  { name: "Margherita Pizza", cuisine: "Italian", type: "veg", price: 340, img: WM("Pizza_quasi_Margherita.jpg"), desc: "Classic sourdough base with San Marzano tomatoes and fresh mozzarella.", restaurantName: "Bella Napoli" },
  { name: "Pepperoni Pizza", cuisine: "Italian", type: "nonveg", price: 390, img: WM("Pepperoni_pizza.jpg"), desc: "Loaded with spicy pepperoni and extra mozzarella.", restaurantName: "Bella Napoli" },
  { name: "Kung Pao Chicken", cuisine: "Chinese", type: "nonveg", price: 300, img: WM("Kung-pao-shanghai.jpg"), desc: "Wok-tossed chicken with peanuts, chili and Sichuan pepper.", restaurantName: "Golden Wok" },
  { name: "Veg Hakka Noodles", cuisine: "Chinese", type: "veg", price: 220, img: WM("Hakka_Noodles.JPG"), desc: "Stir-fried noodles with crunchy vegetables and soy glaze.", restaurantName: "Golden Wok" },
  { name: "Chicken Tacos", cuisine: "Mexican", type: "nonveg", price: 280, img: WM("Variety_of_tacos.jpg"), desc: "Grilled chicken, pico de gallo and lime crema in soft tortillas.", restaurantName: "Casa Fiesta" },
  { name: "Veggie Burrito Bowl", cuisine: "Mexican", type: "veg", price: 250, img: WM("Burrito_Bowl.jpg"), desc: "Rice, black beans, corn salsa and guacamole in a bowl.", restaurantName: "Casa Fiesta" },
  { name: "Classic Cheeseburger", cuisine: "American", type: "nonveg", price: 270, img: WM("Cheeseburger.jpg"), desc: "Beef patty, cheddar, pickles and house sauce on a brioche bun.", restaurantName: "Grill & Bun" },
  { name: "Loaded Fries", cuisine: "American", type: "veg", price: 180, img: WM("Chili_Cheese_Fries_with_fork.jpg"), desc: "Crispy fries topped with cheese sauce, jalapeños and chives.", restaurantName: "Grill & Bun" },
  { name: "Chocolate Lava Cake", cuisine: "Desserts", type: "veg", price: 160, img: WM("Chocolate_lava_cake.jpg"), desc: "Warm chocolate cake with a molten center, served with ice cream.", restaurantName: "Sweet Ending" },
  { name: "Fresh Fruit Tart", cuisine: "Desserts", type: "veg", price: 190, img: WM("Fruit_tart.jpg"), desc: "Buttery tart shell with vanilla custard and seasonal fruit.", restaurantName: "Sweet Ending" },
  { name: "Quinoa Buddha Bowl", cuisine: "American", type: "veg", price: 290, img: WM("Healthy_Gnocchi_Buddha_Bowl.jpg"), desc: "Quinoa, roasted vegetables, chickpeas and tahini dressing.", restaurantName: "Green Bowl" },
  { name: "Grilled Salmon Salad", cuisine: "American", type: "nonveg", price: 410, img: WM("Grilled_salmon.jpg"), desc: "Pan-seared salmon over greens with a citrus vinaigrette.", restaurantName: "Green Bowl" },
  { name: "Chicken Biryani", cuisine: "Indian", type: "nonveg", price: 280, img: WM("Chicken_Biryani.jpg"), desc: "Fragrant basmati rice layered with spiced chicken and saffron.", restaurantName: "Spice Route" },
  { name: "Dal Makhani", cuisine: "Indian", type: "veg", price: 210, img: WM("Punjabi_Dal_Makhani.JPG"), desc: "Black lentils simmered overnight with butter and cream.", restaurantName: "Spice Route" },
];

async function seed() {
  try {
    await connectDB();

    console.log("Clearing existing restaurants and menu items...");
    await MenuItem.deleteMany({});
    await Restaurant.deleteMany({});

    console.log("Inserting restaurants...");
    const insertedRestaurants = await Restaurant.insertMany(restaurants);

    // Build a quick lookup: restaurant name -> its new MongoDB _id
    const restaurantIdByName = {};
    insertedRestaurants.forEach((r) => {
      restaurantIdByName[r.name] = r._id;
    });

    console.log("Inserting menu items...");
    const menuItemsToInsert = menuItems.map(({ restaurantName, ...rest }) => ({
      ...rest,
      restaurant: restaurantIdByName[restaurantName],
    }));

    await MenuItem.insertMany(menuItemsToInsert);

    console.log(`Seed complete: ${insertedRestaurants.length} restaurants, ${menuItemsToInsert.length} menu items.`);
  } catch (error) {
    console.error("Seeding failed:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
    process.exit(0);
  }
}

seed();
