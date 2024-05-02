const { getAuth } = require("firebase-admin/auth");
const firebaseApp = require("../../config/firebase");
const express = require('express');
const {authRequire} = require('../../middlewares/auth.middleware')
const {userService} = require('../../services')
const {productController} = require('../../controllers')
const router = express.Router();

/**
 * test method genRecommendedProduct
 * @param {Number} req.body.uid
 * @param {*} res 
 * @returns 
 */
const handler = function (req, res) {
    productController.genRecommendedProducts(req.body.uid)
    return res.send("hello from server");
}
// router.post('', authRequire, handler);
router.post('', handler);

module.exports = router;