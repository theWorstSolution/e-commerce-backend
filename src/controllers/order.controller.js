const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { orderService, userService, productService } = require('../services');

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
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await orderService.queryOrders(filter, options);
  const result1 = await result.populate('user','name').populate('product','name').execPopulate() 
  console.log(result1)
  res.send(result1);
});

const getOrder = catchAsync(async (req, res) => {
  let {id} = req.params
  var order = await orderService.getOrderById(id);
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
