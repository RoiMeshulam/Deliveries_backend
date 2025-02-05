const express = require('express');
const router = express.Router();
const deliveriesController = require('../controllers/deliveriesController');

// Get all deliveries for a specific day
router.get('/:year/:month/:day', deliveriesController.getDeliveriesByDay);

// Get a delivery by ID
router.get('/:year/:month/:day/:deliveryUID', deliveriesController.getDeliveryById);

// Get deliveries between two dates
router.get('/range', deliveriesController.getDeliveriesBetweenDates);

// Post a new delivery
router.post('/:year/:month/:day', deliveriesController.createDelivery);

// Update a delivery
router.put('/:year/:month/:day/:deliveryUID', deliveriesController.updateDelivery);

// Delete a delivery
router.delete('/:year/:month/:day/:deliveryUID', deliveriesController.deleteDelivery);

module.exports = router;
