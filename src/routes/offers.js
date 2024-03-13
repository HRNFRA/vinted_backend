const express = require('express');
const { requireAuth } = require("../middlewares/auth");
const offerControllers = require('../controllers/offers');
const fileUpload = require('express-fileupload');

const router = express.Router();

router.get("/", offerControllers.getOffers);
router.get("/:id", offerControllers.getOffer); 
router.post("/publish", requireAuth, fileUpload(), offerControllers.publishOffer);
router.put("/modify/:id", requireAuth, fileUpload(), offerControllers.modifyOffer);
router.delete("/delete/:id", requireAuth, offerControllers.deleteOffer);

module.exports = router;