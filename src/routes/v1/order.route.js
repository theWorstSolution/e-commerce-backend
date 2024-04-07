const express = require('express');
const {authRequire} = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate');
const userValidation = require('../../validations/user.validation');
const orderController = require('../../controllers/order.controller');
const router = express.Router();

router.route('').get(orderController.getOrders)
router.route('/order/:id').get(orderController.getOrder).patch(orderController.updateOrder)
router.route('/order').post(orderController.createOrder)

module.exports = router;