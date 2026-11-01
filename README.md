# Yum Cart — Full-Stack Food Delivery App

A full-stack version of the Yum Cart food delivery site: the original HTML/CSS/Bootstrap frontend, now backed by a **Node.js + Express + MongoDB (Mongoose)** API. The UI, styling, animations, filters, search, food modal, and cart offcanvas are all unchanged — only the data layer moved from hardcoded JS arrays to a real database.

```text
yumcart/
│
├── server/
│   ├── server.js
│   ├── .env                  (created for you — edit if your MongoDB differs)
│   ├── .env.example
│   ├── package.json
│   ├── seed.js
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   ├── Restaurant.js
│   │   ├── MenuItem.js
│   │   └── Cart.js
│   ├── routes/
│   │   ├── restaurantRoutes.js
│   │   ├── menuRoutes.js
│   │   └── cartRoutes.js
│   └── controllers/
│       ├── restaurantController.js
│       ├── menuController.js
│       └── cartController.js
│
├── public/
│   └── yumcart-food-delivery.html   (original UI, now calling the API)
│
└── README.md
```

Express serves both the API **and** the static frontend from the same server, so the page can call `fetch('/api/...')` with no hardcoded host/port and no CORS issues.

---

## 1. Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** running locally (or a MongoDB Atlas connection string)

### Installing MongoDB locally

- **macOS (Homebrew):**
  ```bash
  brew tap mongodb/brew
  brew install mongodb-community
  brew services start mongodb-community
  ```
- **Windows:** download the MongoDB Community Server installer from mongodb.com, install it as a service, and it will start automatically.
- **Linux (Ubuntu/Debian):** follow MongoDB's official "Install MongoDB Community Edition" guide for your distro, then:
  ```bash
  sudo systemctl start mongod
  sudo systemctl enable mongod
  ```
- **Or Docker (works anywhere):**
  ```bash
  docker run -d --name yumcart-mongo -p 27017:27017 mongo:7
  ```

Verify it's running:
```bash
mongosh --eval "db.adminCommand('ping')"
```

---

## 2. Install dependencies

```bash
cd yumcart/server
npm install
```

This installs `express`, `mongoose`, `cors`, `dotenv`, and (as a dev dependency) `nodemon`.

---

## 3. Configure environment variables

A `.env` file is already included with sensible local defaults:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/yumcart
```

If your MongoDB runs elsewhere (Docker, Atlas, a different port), edit `MONGO_URI` accordingly, e.g.:
```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/yumcart
```

---

## 4. Seed the database

This inserts the original 8 restaurants and 16 menu items (the exact data that used to be hardcoded in the HTML) and links each menu item to its restaurant:

```bash
npm run seed
```

You should see output like:
```
MongoDB connected: 127.0.0.1/yumcart
Clearing existing restaurants and menu items...
Inserting restaurants...
Inserting menu items...
Seed complete: 8 restaurants, 16 menu items.
Database connection closed.
```

Re-run `npm run seed` any time you want to reset the data back to the original set.

---

## 5. Start the server

```bash
npm run dev      # auto-restarts on file changes (nodemon)
# or
npm start        # plain node
```

You should see:
```
MongoDB connected: 127.0.0.1/yumcart
Yum Cart server running at http://localhost:5000
```

---

## 6. Open the website

Visit **http://localhost:5000** in your browser. This serves `public/yumcart-food-delivery.html` directly from Express — restaurants and menu items load from MongoDB, the cart persists in MongoDB per guest visitor, and everything else (design, animations, filters, modal) behaves exactly as before.

Your browser gets a random `guest-xxxxxxxx` id stored in `localStorage` the first time you visit, so your cart survives a page refresh.

---

## 7. Test the APIs (Postman / Thunder Client / curl)

| Method | Endpoint                              | Purpose             |
|--------|----------------------------------------|----------------------|
| GET    | `/api/restaurants`                     | Get all restaurants |
| GET    | `/api/restaurants/:id`                 | Get one restaurant  |
| POST   | `/api/restaurants`                     | Create restaurant   |
| PUT    | `/api/restaurants/:id`                 | Update restaurant   |
| DELETE | `/api/restaurants/:id`                 | Delete restaurant   |
| GET    | `/api/menu`                            | Get menu (supports `?type=`, `?cuisine=`, `?maxPrice=`, `?search=`, `?restaurant=`) |
| GET    | `/api/menu/:id`                        | Get one menu item   |
| POST   | `/api/menu`                            | Create menu item    |
| PUT    | `/api/menu/:id`                        | Update menu item    |
| DELETE | `/api/menu/:id`                        | Delete menu item    |
| GET    | `/api/cart/:userId`                    | Get cart             |
| POST   | `/api/cart`                            | Create empty cart (`{ "userId": "..." }`) |
| PUT    | `/api/cart/:userId`                    | Replace cart items (`{ "items": [{ "menuItemId": "...", "qty": 2 }] }`) |
| DELETE | `/api/cart/:userId`                    | Clear cart            |
| POST   | `/api/cart/:userId/items`              | Add item (`{ "menuItemId": "...", "qty": 1 }`) |
| PUT    | `/api/cart/:userId/items/:menuItemId`  | Update item quantity (`{ "qty": 3 }`) |
| DELETE | `/api/cart/:userId/items/:menuItemId`  | Remove item            |
| POST   | `/api/cart/:userId/checkout`           | Checkout — clears the cart |
| GET    | `/api/health`                          | Health check          |

Example filter combo:
```
GET /api/menu?type=veg&cuisine=Indian&maxPrice=300&search=paneer
```

Example curl:
```bash
curl http://localhost:5000/api/restaurants
curl -X POST http://localhost:5000/api/cart/guest-test1/items \
  -H "Content-Type: application/json" \
  -d '{"menuItemId":"<paste a real _id from /api/menu>","qty":2}'
curl http://localhost:5000/api/cart/guest-test1
```

All responses follow the shape:
```json
{ "success": true, "data": ... }
```
or on failure:
```json
{ "success": false, "message": "..." }
```

---

## 8. How the cart total is calculated (server-side, always)

```text
subtotal = sum(currentPriceFromMongoDB × quantity)

deliveryFee =
    0   if subtotal >= ₹500
    ₹40 if 0 < subtotal < ₹500
    0   if subtotal == 0

total = subtotal + deliveryFee
```

The browser never sends a price — every cart calculation re-reads the current price of each `MenuItem` from MongoDB, so prices can't be tampered with client-side.

---

## 9. Login (Admin + User)

Open **http://localhost:5000/login** (or click **Login** in the navbar).

| Role  | How to get it | After login goes to |
|-------|---------------|---------------------|
| Admin | Created automatically on server start from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `server/.env` (default `admin@yumcart.com` / `admin123`) | `/admin` dashboard (add/edit/delete restaurants and menu items) |
| User  | Sign up on the login page (**Sign up** tab) | The shop (`/`) |

- Passwords are hashed with bcrypt; sessions use a JWT (`JWT_SECRET` in `.env`, valid 7 days).
- Guests can browse the menu, but adding to cart / checkout sends them to the login page.
- Each user's cart is stored in MongoDB under their own account id and can't be accessed by others.
- Creating/editing/deleting restaurants and menu items now requires an admin token.
- **Change `ADMIN_PASSWORD` and `JWT_SECRET` before deploying anywhere public.**

New endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` (send `Authorization: Bearer <token>`).

---

## 10. Notes

- Checkout doesn't integrate a real payment gateway; it shows the existing "Order placed!" toast and clears the MongoDB cart.
- If a menu item referenced by a cart is later deleted from the catalog (e.g. via the admin CRUD API), the cart automatically drops that stale line item the next time it's loaded.
