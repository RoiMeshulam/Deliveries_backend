const express = require('express');
const deliveryRoutes = require('./deliveriesRoutes');
const userRoutes = require("./userRoutes");
const businessRoutes = require("./businessRoutes");

const router = express.Router();

// Delivery routes
router.use('/deliveries', deliveryRoutes);
router.use("/users",userRoutes);
router.use("/bussiness",businessRoutes);

module.exports = router;