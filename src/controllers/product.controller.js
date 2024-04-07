const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { productService } = require('../services');
const {categoryService} = require('../services')
const { Product } = require('../models');

const createProduct = catchAsync(async (req, res) => {
  const product = await productService.createProduct(req.body);
  categoryService.addProductToCats(product.id, product.categories)
  res.status(httpStatus.CREATED).send(product);
});

//TODO: modify filter
/**
 * @returns products có populate categories name
 */
const getProducts = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  let options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await productService.queryProducts(filter, options);
  const populatedDocs = await Product.populate(result.results,{ path: 'categories', select: 'name' })
  result.results = populatedDocs;
  res.send(result);
});

const getProduct = catchAsync(async (req, res) => {
  let {id} = req.params
  const product = await productService.getProductById(id);
  populatedProduct = await product.populate('categories','name').execPopulate()
  res.send(populatedProduct);
});

const updateProduct = catchAsync(async (req, res) => {
  let oldProduct = await productService.getProductById(req.params.id)
  oldProduct = await oldProduct.populate('categories').execPopulate()
  for(let category of oldProduct.categories){
    category.products = category.products.filter((product)=>{return (product!=req.params.id);})
    category.save()
  }
  let newProduct = await productService.updateProductById(req.params.id, req.body)
  newProduct = await newProduct.populate('categories').execPopulate();
  for(let category of newProduct.categories){
    category.products.push(newProduct.id)
    category.save()
  }
  res.send(newProduct);
});

module.exports = {
  createProduct,
  getProduct,
  getProducts,
  updateProduct,
};
