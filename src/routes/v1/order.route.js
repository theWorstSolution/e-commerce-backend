const express = require('express');
const {authRequire} = require('../../middlewares/auth.middleware');
const orderController = require('../../controllers/order.controller');
const router = express.Router();

router.route('').get(authRequire, orderController.getOrders).post(authRequire,orderController.createOrders)
router.route('/order/:id').get(authRequire, orderController.getOrder).patch(authRequire, orderController.updateOrder)
router.route('/order').post(authRequire,orderController.createOrder)
router.route('/own').get(authRequire,orderController.getOwnOrders)

module.exports = router;