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
const orderSchema = new mongoose.Schema({
    user: {
      type: String,
      ref: 'User' // Reference to the Category model
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product' // Reference to the Category model
    },
    amount: Number,
    totalPrice: Number,
    deliveryFee: {
      type: Number, 
      default: 0
    },
    totalCost: Number,
    status: {
      type: String,
      enum: ['onGoing', 'canceled', 'delivered'],
      default: 'delivered'
    },
    hasPaid: {
      type: Number,
      enum: [0,1],
      default: 1
    }
  });
// Middleware to calculate totalCost before saving
orderSchema.pre('save', function(next) {
  this.totalCost = this.totalPrice + this.deliveryFee;
  next();
});
  // add plugin that converts mongoose to json
  orderSchema.plugin(toJSON);
  orderSchema.plugin(paginate);

  // Create the Product model using the schema
  const Order = mongoose.model('Order', orderSchema);
  
  // Export the Product model
  module.exports = Order;

