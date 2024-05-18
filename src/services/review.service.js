const httpStatus = require('http-status');
const { Product, Review } = require('../models');
const ApiError = require('../utils/ApiError');


const createReview = async (reviewBody) => {
  return Review.create(reviewBody);
};

const queryReviews = async (filter, options) => {
  const reviews = await Review.paginate(filter, options);
  return reviews;
};

const getReviewById = async (id) => {
  return await Review.findById(id);
};

const updateReviewById = async (reviewId, updateBody) => {
  const review = await getReviewById(reviewId);
  if (!review) {
    throw new ApiError(httpStatus.NOT_FOUND, 'review not found');
  }
  Object.assign(review, updateBody);
  await review.save();
  return review;
};

async function hasReviewed(userId, productId) {
  const reviews = await Review.find({ user: userId, product: productId })
  if (reviews.length>0) { return true }
  return false
}

module.exports = {
  createReview,
  queryReviews,
  getReviewById,
  updateReviewById,
  hasReviewed
};
