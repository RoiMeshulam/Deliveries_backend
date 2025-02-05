const express = require('express');
const deliveryRoutes = require('./deliveriesRoutes');

const router = express.Router();

// Delivery routes
router.use('/deliveries', deliveryRoutes);

module.exports = router;