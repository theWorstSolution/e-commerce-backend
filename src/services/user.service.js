const httpStatus = require('http-status');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { func } = require('joi');

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  userBody._id = userBody.uid;
  // if (await User.isEmailTaken(userBody.email)) {
  //   throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  // }
  return User.create(userBody);
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
  const users = await User.paginate(filter, options);
  return users;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  return await User.findById(id);
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.remove();
  return user;
};

/**
 * 
 * @param {String of uid || instance of User} user 
 * @param {Object} noti 
 */
async function createNewNoti(user,noti){
  // case user == uid
  if(typeof user == 'string'){
    user = await getUserById(user)
  }
  noti.id = user.notifications.length
  user.notifications.unshift(noti)
  user.save()
  
}

/**
 * if beforeNoti = null, return 10 latest notis
 * if no notil, return {resNotis:null, hasMore:false}
 * @param {String of notiId} beforeNoti 
 * @param {String} uid 
 * @returns 10 more notis and hasMore
 */
async function fetchNotis(uid,beforeNoti){
	const user = await getUserById(uid)
  const resNotis = []
  let hasMore = true
  let startFetch = false

  if(!beforeNoti){startFetch=true}

	for(let noti of user.notifications){
		if(resNotis.length==10){break}

		if(startFetch){resNotis.push(noti)}
		else if(noti.id == beforeNoti){startFetch=true}
	}
  if(resNotis.length==0){return{resNotis:null, hasMore:false}}
	if(resNotis[resNotis.length-1]==user.notifications[user.notifications.length-1]){ hasMore = false}
	return {resNotis, hasMore}
}

module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  createNewNoti,
  fetchNotis
};
