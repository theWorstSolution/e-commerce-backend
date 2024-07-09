const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { orderService, userService, productService, zalopayService } = require('../services');
const { Order, User } = require('../models');
const { userController } = require('../controllers')
const qs = require('qs');
const { ObjectId } = require('mongodb');
const notiSubcribers = require('../globalVars');
const { createNewNoti } = require('../services/user.service');

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

  const reqUser = req.auth;
  if (reqUser.id != req.body.user) {
    res.status(httpStatus.UNAUTHORIZED).send(); return;
  }
  const product = await productService.getProductById(req.body.product)
  req.body.totalPrice = product.price * req.body.amount
  req.body.totalCost = req.body.totalPrice

  const order = await orderService.createOrder(req.body);

  const payUrl = await zalopayService.createOrder(reqUser.id, [order.id], order.totalCost)
  // product.soldAmount += req.body.amount
  // product.save()

  if (payUrl) {
    res.status(httpStatus.CREATED).send(payUrl);
  } else {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send();
  }

  //
  // userController.genRecommendedProducts(req.body.user)



  // emit notification to admin
  const admins = await User.find({ role: 'admin' })
  const notification = {
    type: 'newOrder', orderId: order.id, username: req.auth.name,
    userId: req.auth.uid, productName: product.name, productId: product.id, amount: req.body.amount, hasSeen: false, createdAt: new Date()
  }
  for (let admin of admins) {
    // save noti to db
    await createNewNoti(admin, notification)

    // send noti to admin subcribers
    if (notiSubcribers[admin.id]) {
      notiSubcribers[admin.id].write('data: ' + JSON.stringify(notification) + '\n\n')
    }
  }


  // update orders and boughtProducts of user
  const user = await userService.getUserById(req.auth.uid)
  user.orders.push(order)

  const hasBought = await userService.hasBought(user, order.product)
  if (!hasBought) {
    user.boughtProducts.push(product.id)
  }
  user.save()

});

/**
 * @param{Array<Object>} req.body.buyList
 * @param{String} req.body.buyList[].productId
 * @param{Number} req.body.buyList[].amount
 */
const createOrders = catchAsync(async (req, res) => {
  const reqUser = req.auth;
  // if (reqUser.role != 'admin') {
  //   res.status(httpStatus.UNAUTHORIZED).send()
  //   return
  // }
  const bodies = await Promise.all(req.body.buyList.map(async (order) => {
    const user = req.auth.uid
    const product = order.productId
    const amount = order.amount
    const totalPrice = (await productService.getProductById(order.productId)).price * order.amount
    const totalCost = totalPrice
    return { user, product, amount, totalPrice, totalCost }
  }))
  const results = await orderService.createOrders(bodies);
  let totalCost = 0;
  const orderIds = results.map((order)=>{
    totalCost+=order.totalCost;
    return order.id
  })
  const payUrl = await zalopayService.createOrder(reqUser.id, orderIds, totalCost)

  res.status(httpStatus.CREATED).send(payUrl);



  // update orders and boughtProducts of user
  const user = await userService.getUserById(req.auth.uid)
  for (let order of results) {
    user.orders.push(order.id)

    const hasBought = await userService.hasBought(user, order.product)
    console.log(hasBought);
    if (!hasBought) {
      user.boughtProducts.push(order.product)
    }
  }
  await user.save()



  // update product.soldAmount
  req.body.buyList.map(async (order) => {
    const product = await productService.getProductById(order.productId)
    product.soldAmount += order.amount
    product.save()
  })



  // save noti for all admins and send noti to online admins
  const newOrders = []
  for (let order of results) {
    const product = await productService.getProductById(order.product)
    const newOrder = { type: 'newOrder', orderId: order.id, username: req.auth.name, userId: req.auth.uid, productName: product.name, productId: product.id, amount: order.amount, hasSeen: false, createdAt: new Date() }
    newOrders.push(newOrder)
  }
  const admins = await User.find({ role: 'admin' })
  for (let admin of admins) {
    for (let notification of newOrders) {
      // save noti to db
      await createNewNoti(admin, notification)

      // send noti to admin subcribers
      if (notiSubcribers[admin.id]) {
        notiSubcribers[admin.id].write('data: ' + JSON.stringify(notification) + '\n\n')
      }

    }
  }



  // userController.genRecommendedProducts(req.body.user)

});



//TODO: modify filter
const getOrders = catchAsync(async (req, res) => {
  const reqUser = req.auth;

  const query = qs.parse(req.url.split('?')[1], { depth: 10 });
  const filter = query.filter
  const options = { sortBy: null, ...query.options }

  if (reqUser.role != 'admin') {
    filter.user = reqUser.uid
  }
  // console.log(JSON.stringify(options,null,2));
  // console.log(JSON.stringify(filter,null,2));
  const result = await orderService.queryOrders(filter, options);
  // const populatedDocs = await Order.populate(result.results,[{ path: 'user', select: 'name' }, {path: 'product', select: 'name'}])
  // result.results = populatedDocs;
  res.send(result);
});

const getOrder = catchAsync(async (req, res) => {
  const reqUser = req.auth;
  let { id } = req.params
  // console.log(id);
  var order = await orderService.getOrderById(id);
  // console.log(JSON.stringify(order,null,2));
  if (!order) {
    res.status(httpStatus.NOT_FOUND).send(); return;
  }
  if (req.auth.role !='admin' && order.user.toString() != reqUser.uid) {
    res.status(httpStatus.UNAUTHORIZED).send(); return;
  }
  order = await order.populate('user', 'name').populate('product', 'name').execPopulate()
  res.send(order);
});

const updateOrder = catchAsync(async (req, res) => {
  // TODO: check quyền admin
  const reqUser = req.auth;
  if (reqUser.role != 'admin') {
    res.status(httpStatus.UNAUTHORIZED).send(); return;
  }
  const oldOrder = await orderService.getOrderById(req.params.id)
  const oldStatus = oldOrder.status

  const order = await orderService.updateOrderById(req.params.id, req.body);
  res.send(order);

  // notify user

  const newStatus = req.body.status
  console.log(oldStatus);
  console.log(newStatus);
  if (newStatus && oldStatus != newStatus) {
    console.log('here');
    const product = await productService.getProductById(oldOrder.product)

    const changeOrderStatusNoti = {
      type: 'ChangeOrderStatusNoti', orderId: req.params.id, createdAt: new Date(),
      productName: product.name, productId: product.id, amount: oldOrder.amount, hasSeen: false, oldStatus,
      newStatus
    }
    // save noti to db
    createNewNoti(oldOrder.user, changeOrderStatusNoti)
    // send to user if online
    if (notiSubcribers[oldOrder.user]) {
      notiSubcribers[oldOrder.user].write('data: ' + JSON.stringify(changeOrderStatusNoti) + '\n\n')
    }

  }

});


/**
 * params keyword, page, startDate, endDate,gmt
 */
const getOwnOrders = catchAsync(async (req, res) => {

  const query = qs.parse(req.url.split('?')[1], { depth: 10 });
  const keyword = query.keyword;
  var id;
  try{
    id = ObjectId(keyword)
  }catch{
    id = null;
  }
  const userId = req.auth.uid;
  const gmt = (query.gmt && query.gmt != '') ? query.gmt : 0;
  // console.log(JSON.stringify(query, null, 2));
  const page = (query.page && query.page != '') ? query.page : 1; // For example, the first page
  const limit = 10;
  let results, totalPages;


  const match = { user: userId };
  if (query.startDate && query.startDate != '' && query.endDate && query.endDate != '') {
    const startDate = new Date(query.startDate);
    startDate.setHours(startDate.getHours() - gmt);
    const endDate = new Date(query.endDate);
    endDate.setHours(endDate.getHours() - gmt);
    match.createdAt = { $gte: startDate, $lt: endDate };
  } else if (query.startDate && query.startDate != '') {
    const startDate = new Date(query.startDate);
    startDate.setHours(startDate.getHours() - gmt);
    match.createdAt = { $gte: startDate };
  } else if (query.endDate && query.endDate != '') {
    endDate.setHours(endDate.getHours() - gmt);
    match.createdAt = { $gte: startDate, $lt: endDate };
    match.createdAt = { $lt: endDate };
  }
  // console.log(JSON.stringify(match, null, 2));

  // Step 1: Count total matching documents
  Order.aggregate([
    // Match orders of the user within the date range
    {
      $match: match
    },

    // Lookup to join with products
    {
      $lookup: {
        from: 'products', // Name of the products collection
        localField: 'product',
        foreignField: '_id',
        as: 'productDetail'
      }
    },

    // Lookup to join with categories within products
    {
      $lookup: {
        from: 'categories', // Assuming categories are in a separate collection named 'categories'
        localField: 'productDetail.categories.id',
        foreignField: '_id',
        as: 'categoryDetails'
      }
    },

    // Match orders where product name or category name includes 'shirt'
    {
      $match: {
        $or: [
          { '_id': id },
          { 'productDetails.name': { $regex: keyword, $options: 'i' } },
          { 'categoryDetails.name': { $regex: keyword, $options: 'i' } }
        ]
      }
    },

    // Group by null to count the number of documents
    {
      $group: {
        _id: null,
        count: { $sum: 1 }
      }
    }
  ]).exec((err, result) => {
    if (err) {
      console.error(err);
    } else {
      const totalCount = result.length > 0 ? result[0].count : 0;
      totalPages = Math.ceil(totalCount / limit);
      // console.log(`Total Pages: ${totalPages}`);

      // Step 2: Retrieve paginated results
      Order.aggregate([
        // Match orders of the user within the date range
        {
          $match: match
        },

        // Lookup to join with products
        {
          $lookup: {
            from: 'products', // Name of the products collection
            localField: 'product',
            foreignField: '_id',
            as: 'product'
          }
        },
        // Unwind the product details array
        { $unwind: '$product' },
        // Lookup to join with categories within products
        {
          $lookup: {
            from: 'categories', // Assuming categories are in a separate collection named 'categories'
            localField: 'product.categories.id',
            foreignField: '_id',
            as: 'categoryDetails'
          }
        },

        // Match orders where product name or category name includes 'shirt'
        {
          $match: {
            $or: [
              { '_id': id },
              { 'product.name': { $regex: keyword, $options: 'i' } },
              { 'categoryDetails.name': { $regex: keyword, $options: 'i' } }
            ]
          }
        },

        // Sort by creation date if needed
        { $sort: { createdAt: -1 } },

        // Paginate results
        { $skip: (page - 1) * limit },
        { $limit: limit },

        // Project the fields you want to return
        {
          $project: {
            user: 1,
            product: 1,
            amount: 1,
            totalPrice: 1,
            deliveryFee: 1,
            totalCost: 1,
            status: 1,
            hasPaid: 1,
            createdAt: 1,
            updatedAt: 1,
            // 'product._id': 1,
            // 'product.name': 1,
            // 'product.price': 1,
            // 'product.description': 1,
            'categoryDetails.name': 1
          }
        }
      ]).exec((err, orders) => {
        if (err) {
          console.error(err);
        } else {
          results = orders
          res.send({ results, totalPages, page });
          // console.log(orders);
        }
      });
    }
  });

});

/**
 * if zalopay confirm transaction then order.haspaid = true
 */
const zalopayCallback = catchAsync(async (req, res) => {
  const { dataJson, result } = zalopayService.checkCallback(req.body.data, req.body.mac)
  // console.log(JSON.stringify(dataJson,null,2));
  if (dataJson) {
    const orderIds = dataJson.embed_data.orderIds
    // console.log(JSON.stringify(orderIds,null,2));
    for (let orderId of orderIds) {
      const order = await orderService.getOrderById(orderId)
      if (order.hasPaid == false) {
        order.hasPaid = true;
        await order.save();
        const product = await productService.getProductById(order.product)
        product.soldAmount += order.amount
        await product.save()
      }
    }
  }
  // thông báo kết quả cho ZaloPay server
  res.json(result);
});



module.exports = {
  createOrder,
  getOrder,
  getOrders,
  updateOrder,
  createOrders,
  getOwnOrders,
  zalopayCallback
};
