const express = require('express');
const {authRequire} = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate');
const userValidation = require('../../validations/user.validation');
const userController = require('../../controllers/user.controller');

const router = express.Router();

router.route('/').get(userController.getUsers)

router.route('/user/subcribe-notifications').get(authRequire,userController.subcribeNotifications)


router.route('/user/recommended-products').post(authRequire, userController.genRecommendedProducts)
  .get(authRequire, userController.getRecommendedProducts)
  
router
  .route('/user/:uid')
  // .post(auth('manageUsers'), validate(userValidation.createUser), userController.createUser)
  .get(authRequire, userController.getUser)
  .patch(authRequire, userController.updateUser)
/* client gửi token, cho qua auth require, đính kèm decoded user vào request,
 vào getUser -> get theo id, nếu chưa có thì create user */




module.exports = router;