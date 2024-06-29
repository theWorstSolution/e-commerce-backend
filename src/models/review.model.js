const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');


// Define the schema for the Review model
const reviewSchema = new mongoose.Schema({
    user: {
      type: String,
      ref: 'User', // Reference to the User model
      required: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product', // Reference to the Product model
      required: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timeCreated: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
  },);
  reviewSchema.plugin(toJSON);
  reviewSchema.plugin(paginate);
  // Create the Review model using the schema
  const Review = mongoose.model('Review', reviewSchema);
  
  // Export the Review model
  module.exports = Review;