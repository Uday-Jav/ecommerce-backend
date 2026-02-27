require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 5001;


// DATABASE
require("./database/setup");


// ⭐ Allowed Frontend Origins
const allowedOrigins = [

  "http://localhost:5173",

  "https://beautiful-rugelach-7b300f.netlify.app"

];


// ⭐ CORS Middleware (Best Practice)
app.use(cors({

  origin: function (origin, callback) {

    // allow Postman/mobile apps
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {

      callback(null, true);

    } else {

      console.log("Blocked by CORS:", origin);

      callback(new Error("Not allowed by CORS"));

    }

  },

  credentials: true

}));


app.use(express.json());


// ROUTES

const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const orderRoutes = require("./routes/orderRoutes");
const notificationRoutes = require("./routes/notificationRoutes");


// API ROUTES

app.use("/api/products", productRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/payment", paymentRoutes);

app.use("/api/notifications", notificationRoutes);


// STATIC UPLOADS

app.use("/uploads", express.static("uploads"));


// HEALTH CHECK

app.get("/", (req, res) => {

  res.json({

    message: "API is running"

  });

});


// 404

app.use((req, res) => {

  res.status(404).json({

    message: "Route not found"

  });

});


// SERVER START

app.listen(PORT, () => {

  console.log(`Server running on port ${PORT}`);

});