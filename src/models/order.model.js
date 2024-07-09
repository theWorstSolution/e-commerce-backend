const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');
const { productService } = require('../services');

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
    enum: ['onGoing', 'canceled', 'delivered', 'waitToConfirm', 'confirmed'],
    default: 'onGoing'
  },
  hasPaid: {
    type: Boolean,
    default: false
  }
},
  {
    timestamps: true,
  },);

// // Middleware to handle the 'hasPaid' field update
// orderSchema.pre('findOneAndUpdate', async function (next) {
//   this._update = this.getUpdate();
//   if (this._update.$set && this._update.$set.hasPaid) {
//     this._original = await this.model.findOne(this.getQuery());
//   }
//   next();
// });

// orderSchema.post('findOneAndUpdate', async function (doc) {
//   if (this._original && this._original.hasPaid === false && doc.hasPaid === true) {
//     // hasPaid changed from false to true
//     console.log('hasPaid was updated from false to true');
//     const product = await productService.getProductById(this.product)
//     product.soldAmount += req.body.amount
//     product.save()
//     // Trigger your custom logic here, e.g., sending a notification or email
//   }
// });

// // log luồng ++ product amount khi set has paid to true
// // Middleware to handle the 'hasPaid' field update on save
// orderSchema.pre('save', function (next) {
//   console.log('trigger pre save');
//   this._original = this.isNew ? null : this.$__.original;
//   next();
// });

// orderSchema.post('save', async function (doc) {
//   if (this._original && this._original.hasPaid === false && doc.hasPaid === true) {
//     // hasPaid changed from false to true
//     console.log('hasPaid was updated from false to true');
//     const product = await productService.getProductById(this.product)
//     product.soldAmount += req.body.amount
//     product.save()
//     // Trigger your custom logic here, e.g., sending a notification or email
//   }
// });
// Middleware to calculate totalCost before saving
// orderSchema.pre('save', function(next) {
//   this.totalCost = this.totalPrice + this.deliveryFee;
//   next();
// });
// add plugin that converts mongoose to json
orderSchema.plugin(toJSON);
orderSchema.plugin(paginate);

// Create the Product model using the schema
const Order = mongoose.model('Order', orderSchema);

// Export the Product model
module.exports = Order;

