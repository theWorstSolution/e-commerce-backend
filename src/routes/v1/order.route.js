const express = require('express');
const {authRequire} = require('../../middlewares/auth.middleware');
const orderController = require('../../controllers/order.controller');
const router = express.Router();

router.route('').get(orderController.getOrders).post(authRequire,orderController.createOrders)
router.route('/order/:id').get(orderController.getOrder).patch(orderController.updateOrder)
router.route('/order').post(authRequire,orderController.createOrder)

module.exports = router;