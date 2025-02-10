const express = require("express");
const router = express.Router();
const businessController = require("../controllers/businessController");
const authenticateToken = require("../middlewares/authMiddleware");

router.get("/", authenticateToken, businessController.getBusinesses);
router.get("/:businessUID", authenticateToken, businessController.getBusinessById);
router.post("/", authenticateToken, businessController.createBusiness);
router.put("/:businessUID", authenticateToken, businessController.updateBusiness);
router.delete("/:businessUID", authenticateToken, businessController.deleteBusiness);

module.exports = router;
