const express = require('express');
const {authRequire} = require('../../middlewares/auth.middleware');
const productController = require('../../controllers/product.controller');
const {adminRequire} = require('../../middlewares/adminRequire');
const router = express.Router();

router.route('').get(productController.getProducts)
router.route('/product/:id').get(productController.getProduct).patch(authRequire, adminRequire, productController.updateProduct)
router.route('/product').post(authRequire, adminRequire, productController.createProduct)

module.exports = router;