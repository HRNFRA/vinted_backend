const mongoose = require("mongoose");

const OfferSchema = mongoose.Schema({
  product_name: {type: String, required: true},
  product_description: {type: String, required: true},
  product_price: {type: Number, required: true},
  product_details: {type: Array},
  product_image: {type: Object, required: true},
  product_pictures: {type: Array, required: true},
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("Offer", OfferSchema);