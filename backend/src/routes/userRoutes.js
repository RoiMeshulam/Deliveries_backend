const express = require("express");
const { signIn, signUp } = require("../controllers/usersController");

const router = express.Router();

router.post("/signup", signUp); // User Registration
router.post("/signin", signIn); // User Login

module.exports = router;
