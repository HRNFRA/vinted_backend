const express = require('express');
const userControllers = require('../controllers/users');
const fileUpload = require('express-fileupload');

const router = express.Router();

router.post("/signup", fileUpload(),userControllers.signUp);
router.get("/login", userControllers.login);

module.exports = router;