const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { productService, userService } = require('../services');
const { categoryService } = require('../services')
const { Product, Order } = require('../models');
const matrixUlti = require('../utils/matrixUlti')
const qs = require('qs')


//TODO: check thông tin categories đúng ko
const createProduct = catchAsync(async (req, res) => {
  const product = await productService.createProduct(req.body);
  categoryService.addProductToCats(product.id, product.categories.map((cat => cat.id)))
  res.status(httpStatus.CREATED).send(product);
});

/**
 * @returns products
 */
const getProducts = catchAsync(async (req, res) => {
  const query = qs.parse(req.url.split('?')[1]);
  const filter = query.filter
  const options = { sortBy: 'name:asc', ...query.options }
  // const options = {sortBy: null}
  // console.log(JSON.stringify(filter));
  // console.log(options);
  const result = await productService.queryProducts(filter, options);
  // const populatedDocs = await Product.populate(result.results,{ path: 'categories', select: 'name' })
  // result.results = populatedDocs;
  res.send(result);
});

const getProduct = catchAsync(async (req, res) => {
  let { id } = req.params
  const product = await productService.getProductById(id);
  // populatedProduct = await product.populate('categories','name').execPopulate()
  const populatedProduct = await product.populate('similarProducts').execPopulate()
  res.send(populatedProduct);
  // res.send(product)
});

const updateProduct = catchAsync(async (req, res) => {
  let oldProduct = await productService.getProductById(req.params.id)
  oldProduct = await oldProduct.populate('categories.id').execPopulate()
  for (let category of oldProduct.categories) {
    category.id.products = category.id.products.filter((product) => { return (product != req.params.id); })
    category.id.save()
  }
  let newProduct = await productService.updateProductById(req.params.id, req.body)
  newProduct = await newProduct.populate('categories.id').execPopulate();
  for (let category of newProduct.categories) {
    category.id.products.push(newProduct.id)
    category.id.save()
  }
  res.send(newProduct);
});

async function calcProductDistanceMatrix() {
  let products = await Product.find().select('name price soldAmount rating categories').populate('categories.id')

  // normalize data point
  let maxPrice = -1, maxSoldAmount = -1, maxCategoryValue = -1, minPrice = Infinity, minSoldAmount = Infinity, minCategoryValue = Infinity
  for (let product of products) {
    if (product.price > maxPrice) {
      maxPrice = product.price
    }
    if (product.price < minPrice) {
      minPrice = product.price
    }
    if (product.soldAmount > maxSoldAmount) {
      maxSoldAmount = product.soldAmount
    }
    if (product.soldAmount < minSoldAmount) {
      minSoldAmount = product.soldAmount
    }
    if (product.categories[product.categories.length - 1].id.value > maxCategoryValue) {
      maxCategoryValue = product.categories[product.categories.length - 1].id.value
    }
    if (product.categories[product.categories.length - 1].id.value < minCategoryValue) {
      minCategoryValue = product.categories[product.categories.length - 1].id.value
    }
  }
  products = products.map((product) => {
    // nhân với hệ số nếu thuộc tính quan trọng
    return {
      id: product.id,
      name: product.name,
      categories: product.categories,
      price: (product.price - minPrice) * 2 / (maxPrice - minPrice),
      soldAmount: (product.soldAmount - minSoldAmount) / (maxSoldAmount - minSoldAmount),
      rating: product.rating / 5,
      categoryValue: 4 * (Math.log10(product.categories[product.categories.length - 1].id.value) - Math.log10(minCategoryValue)) / (Math.log10(maxCategoryValue) - Math.log10(minCategoryValue))
    }
  })
//   console.log('product');
//   console.log(JSON.stringify(products,null,2));
// console.log('======================================');
  const distMatrix = {}
  for (let product1 of products) {
    distMatrix[product1.id] = {}
    for (let product2 of products) {
      console.log(product1.id + ' + ' + product2.id);
      if (product1.id == product2.id) {
        distMatrix[product1.id][product2.id] = Infinity
        continue
      }

      if (distMatrix[product2.id]) {
        if (distMatrix[product2.id][product1.id]) {
          distMatrix[product1.id][product2.id] = distMatrix[product2.id][product1.id]
          continue
        }
      }
      
      distMatrix[product1.id][product2.id] = matrixUlti.calcDistance(product1, product2)
      console.log(distMatrix[product1.id][product2.id]);
    }
  }
  // console.log('&&&&&&&&&&&&&&&&&&end');
  return distMatrix
}

// Merge sort function
function mergeSort(arr, distMatrix, productId) {
  if (arr.length <= 1) {
    return arr;
  }

  const middle = Math.floor(arr.length / 2);
  const left = arr.slice(0, middle);
  const right = arr.slice(middle);

  return merge(
    mergeSort(left, distMatrix, productId),
    mergeSort(right, distMatrix, productId),
    distMatrix,
    productId
  );
}

function merge(left, right, distMatrix, productId) {
  let result = [];
  let indexLeft = 0;
  let indexRight = 0;

  while (indexLeft < left.length && indexRight < right.length) {
    if (distMatrix[productId][left[indexLeft]] < distMatrix[productId][right[indexRight]]) {
      result.push(left[indexLeft]);
      indexLeft++;
    } else {
      result.push(right[indexRight]);
      indexRight++;
    }
  }

  return result.concat(left.slice(indexLeft)).concat(right.slice(indexRight));
}


async function genSimilarProduct() {
  const distMatrix = await calcProductDistanceMatrix();
  // console.log('dist matrix');
  // console.log(JSON.stringify(distMatrix, null, 2));
  // console.log('---------------------------------');
  const productIds = Object.keys(distMatrix)
  const similarProductsOf = {}
  for (let productId1 of Object.keys(distMatrix)) {
    // output: sorted array of productId with distance ascending order
    similarProductsOf[productId1] = mergeSort(productIds, distMatrix, productId1);
    const product1 = await productService.getProductById(productId1)
    product1.similarProducts = similarProductsOf[productId1].slice(0, 20);
    // console.log(JSON.stringify(product1, null, 2));
    await product1.save()
  }
}



module.exports = {
  createProduct,
  getProduct,
  getProducts,
  updateProduct,
  genSimilarProduct,
};
