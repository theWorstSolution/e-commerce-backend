const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { orderService, userService, productService } = require('../services');
const { Order } = require('../models');
const qs = require('qs')

/* check chỉ cho user tạo order với id của họ */
const createOrder = catchAsync(async (req, res) => {
  // const reqSender = await userService.getUserById(req.auth.uid)
  // if(reqSender.role!='admin' && reqSender.id!=req.body.user){
  //   // not authorize
  //   res.send()
  //   return
  // }

  const order = await orderService.createOrder(req.body);
  const product = await productService.getProductById(req.body.product)
  product.soldAmount += req.body.amount
  product.save()
  
  res.status(httpStatus.CREATED).send(order);
});

//TODO: modify filter
const getOrders = catchAsync(async (req, res) => {
  const query = qs.parse(req.url.split('?')[1], { depth: 10 });
  const filter = query.filter
  const options = {sortBy:null ,...query.options}
  console.log(JSON.stringify(options));
  console.log(JSON.stringify(filter));
  const result = await orderService.queryOrders(filter, options);
  const populatedDocs = await Order.populate(result.results,[{ path: 'user', select: 'name' }, {path: 'product', select: 'name'}])
  result.results = populatedDocs;
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
  updateOrder
};
