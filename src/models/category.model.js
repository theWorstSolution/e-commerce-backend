const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');


/* 
  các field ràng buộc với schema khác cần update theo:
  ancestor, children - other category
  product - product
*/
const categorySchema = new mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    picture: String,
    ancestors: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category' // Reference to the Category model itself
    }],
    children: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category' // Reference to the Category model itself
    }],
    products: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product' // Reference to the Product model
    }]
  });
  // add plugin that converts mongoose to json
categorySchema.plugin(toJSON);
categorySchema.plugin(paginate);
  // Create the Category model using the schema
  const Category = mongoose.model('Category', categorySchema);
  
  // Export the Category model
  module.exports = Category;



