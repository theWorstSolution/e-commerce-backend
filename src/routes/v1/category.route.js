const express = require('express');
const {authRequire} = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate');
const userValidation = require('../../validations/user.validation');
const categoryController = require('../../controllers/category.controller');
const router = express.Router();

router.route('/category/:id/children').get(categoryController.getChildrenOfCategory)
router.route('/category').post(categoryController.createCategory)


module.exports = router;