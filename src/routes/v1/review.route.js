const express = require('express');
const {authRequire} = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate');
const userValidation = require('../../validations/user.validation');
const reviewController = require('../../controllers/review.controller');
const router = express.Router();

router.route('').get(reviewController.getReviews)
router.route('/review/:reviewId').patch(authRequire,reviewController.updateReview).delete(authRequire, reviewController.deleteReview)
router.route('/review').post(authRequire,reviewController.createReview)

module.exports = router;