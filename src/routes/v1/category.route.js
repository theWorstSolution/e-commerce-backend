const express = require('express');
const {authRequire} = require('../../middlewares/auth.middleware');
const categoryController = require('../../controllers/category.controller');
const { adminRequire } = require('../../middlewares/adminRequire');
const router = express.Router();

router.route('').get(categoryController.getCategories)
router.route('/category/:id/children').get(categoryController.getChildrenOfCategory)
router.route('/category').post(authRequire, adminRequire, categoryController.createCategory)
router.route('/category/:id').get(categoryController.getCategory).patch(authRequire, adminRequire, categoryController.updateCategory)


module.exports = router;