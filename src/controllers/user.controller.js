const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');
const qs = require('qs')
const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const query = qs.parse(req.url.split('?')[1]);
  const filter = query.filter
  let options = query.options
  options = {sortBy:null, ...options}
  console.log(JSON.stringify(filter));
  console.log(JSON.stringify(options));
  const result = await userService.queryUsers(filter, options);
  console.log(result)
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  let {uid} = req.params
  if(req.auth.role==='user'){
    if(req.auth.uid!=req.params.uid){
      // TODO: permission deny
      res.send()
    }
  }

  var user = await userService.getUserById(uid);
  if (!user || user === undefined) {
    if(req.auth.role==='user'){
      user = await userService.createUser(req.auth)
    }else{
      // TODO: USER not found
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
  }
  // console.log(user)
  res.send(user);
  
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.uid, req.body);
  res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
};
