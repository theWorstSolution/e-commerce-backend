const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { productService } = require('../services');
const {categoryService} = require('../services')
const { Product } = require('../models');
const qs = require('qs')

//TODO: check thông tin categories đúng ko
const createProduct = catchAsync(async (req, res) => {
  const product = await productService.createProduct(req.body);
  categoryService.addProductToCats(product.id, product.categories.map((cat=>cat.id)))
  res.status(httpStatus.CREATED).send(product);
});

/**
 * @returns products
 */
const getProducts = catchAsync(async (req, res) => {
  const query = qs.parse(req.url.split('?')[1]);
  const filter = query.filter
  const options = query.options
  // const options = {sortBy: null}
  console.log(JSON.stringify(filter));
  console.log(options);
  const result = await productService.queryProducts(filter, options);
  // const populatedDocs = await Product.populate(result.results,{ path: 'categories', select: 'name' })
  // result.results = populatedDocs;
  res.send(result);
});

const getProduct = catchAsync(async (req, res) => {
  let {id} = req.params
  const product = await productService.getProductById(id);
  // populatedProduct = await product.populate('categories','name').execPopulate()
  // res.send(populatedProduct);
  res.send(product)
});

const updateProduct = catchAsync(async (req, res) => {
  let oldProduct = await productService.getProductById(req.params.id)
  oldProduct = await oldProduct.populate('categories.id').execPopulate()
  for(let category of oldProduct.categories){
    category.id.products = category.id.products.filter((product)=>{return (product!=req.params.id);})
    category.id.save()
  }
  let newProduct = await productService.updateProductById(req.params.id, req.body)
  newProduct = await newProduct.populate('categories.id').execPopulate();
  for(let category of newProduct.categories){
    category.id.products.push(newProduct.id)
    category.id.save()
  }
  res.send(newProduct);
});

module.exports = {
  createProduct,
  getProduct,
  getProducts,
  updateProduct,
};
