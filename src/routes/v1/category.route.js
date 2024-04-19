const express = require('express');
const {authRequire} = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate');
const userValidation = require('../../validations/user.validation');
const categoryController = require('../../controllers/category.controller');
const router = express.Router();

router.route('').get(categoryController.getCategories)
router.route('/category/:id/children').get(categoryController.getChildrenOfCategory)
router.route('/category').post(categoryController.createCategory)
router.route('/category/:id').get(categoryController.getCategory).patch(categoryController.updateCategory)


module.exports = router;