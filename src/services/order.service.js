const httpStatus = require('http-status');
const { Order } = require('../models');
const ApiError = require('../utils/ApiError');

const createOrder = async (body) => {
    return Order.create(body);
  };

  const queryOrders = async (filter, options) => {
    const orders = await Order.paginate(filter, options);
    return orders;
  };

  const getOrderById = async (id) => {
    return await Order.findById(id);
  };

  const updateOrderById = async (id, updateBody) => {
    const order = await getProductById(id);
    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, 'order not found');
    }
    Object.assign(order, updateBody);
    await order.save();
    return order;
  };

  module.exports = {
    createOrder,
    queryOrders,
    getOrderById,
    updateOrderById,
  };
  