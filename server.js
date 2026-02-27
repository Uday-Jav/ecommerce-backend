require("dotenv").config();

const express = require("express");

const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 5001;


// DATABASE

require("./database/setup");


// Middleware

app.use(cors({

    origin: ["http://localhost:5173", "https://ecommerce-backend-73q6.onrender.com/api"],

    credentials: true

}));

app.use(express.json());


// ROUTES

const productRoutes =
    require("./routes/productRoutes");

const authRoutes =
    require("./routes/authRoutes");

const userRoutes =
    require("./routes/userRoutes");

const paymentRoutes =
    require("./routes/paymentRoutes");

const orderRoutes =
    require("./routes/orderRoutes");



// API ROUTES

app.use("/api/products",
    productRoutes);

app.use("/api/auth",
    authRoutes);

app.use("/api/users",
    userRoutes);

app.use("/api/orders",
    orderRoutes);

app.use("/api/payment",
    paymentRoutes);

const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);




// STATIC UPLOADS

app.use(

    "/uploads",

    express.static("uploads")

);




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

    console.log(

        `Server running on port ${PORT}`

    );

});
