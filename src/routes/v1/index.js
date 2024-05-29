const express = require('express');
const userRoute = require('./user.route');
const config = require('../../config/config');
const testRoute = require('./test.route');
const productRoute = require('./product.route')
const categoryRoute = require('./category.route')
const orderRoute = require('./order.route')
const reviewRoute = require('./review.route')
const Product = require('../../models/product.model');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/products',
    route: productRoute,
  },
  {
    path: '/categories',
    route: categoryRoute,
  },
  {
    path: '/orders',
    route: orderRoute,
  },
  {
    path: '/reviews',
    route: reviewRoute,
  },
  {
    path: '/test',
    route: testRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
