const express = require('express');
const deliveryRoutes = require('./deliveriesRoutes');
const userRoutes = require("./userRoutes")

const router = express.Router();

// Delivery routes
router.use('/deliveries', deliveryRoutes);
router.use("/users",userRoutes);

module.exports = router;