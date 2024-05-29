const express = require('express');
const {authRequire} = require('../../middlewares/auth.middleware');
const productController = require('../../controllers/product.controller');
const router = express.Router();

router.route('').get(productController.getProducts)
router.route('/product/:id').get(productController.getProduct).patch(productController.updateProduct)
router.route('/product').post(productController.createProduct)

module.exports = router;