const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const userSchema = mongoose.Schema(
  {
    _id: String,
    name: {
      type: String,
      // required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email");
        }
      },
    },
    role: {
      type: String,
      enum: roles,
      default: "user",
    },
    email_verified: {
      type: Boolean,
    },
    picture: String,
    phoneNumber: String,
    address:{
      city: String,
      district: String,
      ward: String
    },
    cart: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product' // Reference to the Category model
    }],
    recommendedProducts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product' // Reference to the Category model
    }],
    notifications: []
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * @typedef User
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
