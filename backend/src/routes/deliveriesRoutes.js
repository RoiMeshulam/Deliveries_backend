const express = require("express");
const router = express.Router();
const deliveriesController = require("../controllers/deliveriesController");
const authenticateToken = require("../middlewares/authMiddleware");

router.get("/:year/:month/:day", authenticateToken, deliveriesController.getDeliveriesByDay);
router.get("/:year/:month/:day/:deliveryUID", authenticateToken, deliveriesController.getDeliveryById);
router.get("/range", authenticateToken, deliveriesController.getDeliveriesBetweenDates);
router.post("/:year/:month/:day", authenticateToken, deliveriesController.createDelivery); // Set empty data for a specific date
// router.post('/:year/:month/:day/empty', deliveriesController.setEmptyDataForDay);
router.put("/:year/:month/:day/:deliveryUID", authenticateToken, deliveriesController.updateDelivery);
router.delete("/:year/:month/:day/:deliveryUID", authenticateToken, deliveriesController.deleteDelivery);

module.exports = router;
