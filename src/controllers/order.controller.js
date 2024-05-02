const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { orderService, userService, productService } = require('../services');
const { Order } = require('../models');
const {productController} = require('../controllers')
const qs = require('qs')

/* check chỉ cho user tạo order với id của họ */
/**
 * @param {String} req.body.user userid
 * @param {String} req.body.product productId
 * @param {Number} req.body.amount
 */
const createOrder = catchAsync(async (req, res) => {
  // const reqSender = await userService.getUserById(req.auth.uid)
  // if(reqSender.role!='admin' && reqSender.id!=req.body.user){
  //   // not authorize
  //   res.send()
  //   return
  // }
  const product = await productService.getProductById(req.body.product)
  req.body.totalPrice = product.price * req.body.amount
  req.body.totalCost = req.body.totalPrice
  const order = await orderService.createOrder(req.body);
  
  product.soldAmount += req.body.amount
  product.save()
  
  res.status(httpStatus.CREATED).send(order);
  productController.genRecommendedProducts(req.body.user)
});

/**
 * @param{String} req.body.userId
 * @param{Array<Object>} req.body.buyList
 * @param{String} req.body.buyList[].productId
 * @param{Number} req.body.buyList[].amount
 */
const createOrders = catchAsync(async (req, res) => {
  const bodies = await Promise.all(req.body.buyList.map(async(order)=>{
    const user = req.body.userId
    const product = order.productId
    const amount = order.amount
    const totalPrice = (await productService.getProductById(order.productId)).price * order.amount
    const totalCost = totalPrice
    return {user, product, amount, totalPrice, totalCost}
  }))
  const results = await orderService.createOrders(bodies);
  res.status(httpStatus.CREATED).send(results);
  req.body.buyList.map(async(order)=>{
    const product = await productService.getProductById(order.productId)
    product.soldAmount += order.amount
    product.save()
  })
  productController.genRecommendedProducts(req.body.userId)
});



//TODO: modify filter
const getOrders = catchAsync(async (req, res) => {
  const query = qs.parse(req.url.split('?')[1], { depth: 10 });
  const filter = query.filter
  const options = {sortBy:null ,...query.options}
  console.log(JSON.stringify(options));
  console.log(JSON.stringify(filter));
  const result = await orderService.queryOrders(filter, options);
  // const populatedDocs = await Order.populate(result.results,[{ path: 'user', select: 'name' }, {path: 'product', select: 'name'}])
  // result.results = populatedDocs;
  res.send(result);
});

const getOrder = catchAsync(async (req, res) => {
  let {id} = req.params
  var order = await orderService.getOrderById(id);
  order = await order.populate('user','name').populate('product','name').execPopulate()
  res.send(order);
});

const updateOrder = catchAsync(async (req, res) => {
  // TODO: check quyền admin
  const order = await orderService.updateOrderById(req.params.id, req.body);
  res.send(order);
});



module.exports = {
  createOrder,
  getOrder,
  getOrders,
  updateOrder,
  createOrders
};
