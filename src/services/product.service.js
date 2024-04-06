const httpStatus = require('http-status');
const { Product } = require('../models');
const ApiError = require('../utils/ApiError');

const createProduct = async (productBody) => {
    // TODO: check product đã có chưa
    return Product.create(productBody);
  };

  const queryProducts = async (filter, options) => {
    const products = await Product.paginate(filter, options);
    return products;
  };

  const getProductById = async (id) => {
    return await Product.findById(id);
  };

  const updateProductById = async (productId, updateBody) => {
    const product = await getProductById(productId);
    if (!product) {
      throw new ApiError(httpStatus.NOT_FOUND, 'product not found');
    }
    Object.assign(product, updateBody);
    await product.save();
    return product;
  };

  module.exports = {
    createProduct,
    queryProducts,
    getProductById,
    updateProductById,
  };
  