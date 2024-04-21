const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

// Define the schema for the Product model
/* 
  các field ràng buộc với schema khác cần update theo:
  categories - category.products
  reviewsS
*/
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  categories: [{
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category' // Reference to the Category model
    },
    name: String
  }],
  price: {
    type: Number,
    required: true
  },
  picture: [{
    type: String,
    required: true
  }],
  description: {
    type: String,
    required: true
  },
  status: {
    type: Number,
    enum: [0, 1], // 0: disabled, 1: active
    default: 1 // Default to active
  },
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review' // Reference to the Review model
  }],
  rating:{
    type: Number,
    default: 3
  },
  soldAmount: {
    type: Number,
    default: 0
  }
});
productSchema.pre('update', function(next) {
  //TODO: update rating based on reviews
  // this.totalCost = this.totalPrice + this.deliveryFee;
  next();
});

// add plugin that converts mongoose to json
productSchema.plugin(toJSON);
productSchema.plugin(paginate);

// Create the Product model using the schema
const Product = mongoose.model('Product', productSchema);

// Export the Product model
module.exports = Product;

