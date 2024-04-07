const httpStatus = require('http-status');
const { Category } = require('../models');
const ApiError = require('../utils/ApiError');
const { func } = require('joi');

const rootCategoryId = '660b2b2353065020b4909007';

function getRootCategory() {
  return getCategoryById(rootCategoryId)
}

const createCategory = async (body) => {
  return Category.create(body);
};

const queryCategories = async (filter, options) => {
  const categories = await Category.paginate(filter, options);
  return categories;
};

const getCategoryById = async (id) => {
  return await Category.findById(id);
};

const updateCategoryById = async (id, body) => {
  const category = await getCategoryById(id);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'category not found');
  }
  Object.assign(category, body);
  await category.save();
  return category;
};

const addProductToCats = async (productId, catsIdList) => {
  for (let catId of catsIdList) {
    let cat = await getCategoryById(catId)
    cat.products.push(productId)
    cat.save()
  }
};



module.exports = {
  createCategory,
  queryCategories,
  getCategoryById,
  updateCategoryById,
  getRootCategory,
  addProductToCats,
  rootCategoryId,
};
