const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService, productService } = require('../services');
const qs = require('qs');
const { Product, Order } = require('../models');
const matrixUlti = require('../utils/matrixUlti');
const notiSubcribers = require('../globalVars');


/**
 * no need params, use access token in header
 */
const createUser = catchAsync(async (req, res) => {
  const authUser = req.auth
  const user = await userService.createUser(authUser);
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const query = qs.parse(req.url.split('?')[1]);
  const filter = query.filter
  let options = query.options
  options = { sortBy: null, ...options }
  // console.log(JSON.stringify(filter));
  // console.log(JSON.stringify(options));
  const result = await userService.queryUsers(filter, options);
  // console.log(result)
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  let { uid } = req.params
  if (req.auth.role === 'user') {
    if (req.auth.uid != req.params.uid) {
      // TODO: permission deny
      res.send()
    }
  }

  var user = await userService.getUserById(uid);
  if (!user || user === undefined) {
    if (req.auth.role === 'user') {
      user = await userService.createUser(req.auth)
    } else {
      // TODO: USER not found
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
  }
  console.log('--++');
  console.log(user)
  res.send(user);

});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.uid, req.body);
  res.send(user);
});

// const deleteUser = catchAsync(async (req, res) => {
//   await userService.deleteUserById(req.params.userId);
//   res.status(httpStatus.NO_CONTENT).send();
// });



async function subcribeNotifications(req, res) {
  const { uid } = req.params

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader("Access-Control-Allow-Origin", '*');
  res.setHeader('Content-Encoding', 'none')


  const { resNotis, hasMore } = await userService.fetchNotis(uid)
  const fetchNotisRes = { type: 'fetchNotis', resNotis, hasMore }
  res.write('data: ' + JSON.stringify(fetchNotisRes) + '\n\n')

  // send number of noti that hasn't been seen 
  let noOfNotSeenNoti = 0
  const user = await userService.getUserById(uid)
  for (let noti of user.notifications) {
    if (noti.hasSeen) { break; }
    else { ++noOfNotSeenNoti }
  }
  const noOfNotSeenNotiMess = { type: 'noOfNotSeenNoti', noOfNotSeenNoti }
  res.write('data: ' + JSON.stringify(noOfNotSeenNotiMess) + '\n\n')

  // Add client to list of subscribers
  notiSubcribers[uid] = res;

  // Handle client disconnect
  req.on('close', () => {
    delete notiSubcribers[uid]
  });
}


async function fetchNotis(req, res) {
  console.log(req.url);
  const query = qs.parse(req.url.split('?')[1]);
  console.log(query);
  const beforeNoti = query.beforeNoti
  console.log(beforeNoti);
  const { resNotis, hasMore } = await userService.fetchNotis(req.auth.uid,beforeNoti)
  const fetchNotisRes = { type: 'fetchNotis', resNotis, hasMore }
  res.send(fetchNotisRes)
}


async function setHasReadAllNotis(req, res) {
  console.log('setHasReadAllNotis');
  const user = await userService.getUserById(req.auth.uid)
  for (let noti of user.notifications) {
    if (noti.hasSeen) {
      break
    }
    noti.hasSeen = true
  }
  user.markModified('notifications');
  user.save()
  res.send('sucess')
}



/**
 * 
 * @param {Object} req.auth {uid,...} 
 */
async function genRecommendedProducts(req, res) {
  const uid = req.auth.uid
  console.log(uid)

  // all products
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
    return {
      name: product.name, id: product.id,
      price: (product.price - minPrice) * 10 / (maxPrice - minPrice),
      // soldAmount: (product.soldAmount-minSoldAmount)/(maxSoldAmount-minSoldAmount),
      rating: product.rating / 5,
      categoryValue: 10 * (Math.log10(product.categories[product.categories.length - 1].id.value) - Math.log10(minCategoryValue)) / (Math.log10(maxCategoryValue) - Math.log10(minCategoryValue))
    }
  })



  const boughtProducts = await Order.find({ user: uid }).distinct('product')  // ['id1','id2',...]
  // console.log('^^^^products after normalize');
  // console.log(JSON.stringify(products,null,2));

  // max cluster
  const maxI = boughtProducts.length * 2

  // init u_: [maxI] of productId -> membership // Example: [{'productId1':0.5, 'productId2':0.2},....]
  const u_InitElement = {}
  for (let product of products) {
    u_InitElement[product.id] = 0;
  }
  const u_ = []
  for (let i = 0; i < maxI; i++) {
    u_.push({ ...u_InitElement })
  }
  // asign each boughtProduct to a separate k
  let initI = 0
  const initMembership = 0.95
  for (let boughtProduct of boughtProducts) {
    u_[initI][boughtProduct] = initMembership
    initI += 1
  }

  // init u: [maxI] of productId -> membership // Example: [{'productId1':0.5, 'productId2':0.2},....]
  const u = []
  for (let i = 0; i < maxI; i++) {
    u.push({})
  }
  for (let product of products) {
    const randomMembership = matrixUlti.genRandomArrayWithSum(1, maxI)
    for (let i = 0; i < maxI; i++) {
      u[i][product.id] = randomMembership[i]
    }
  }


  const eps = 0.05
  const m = 2
  let prevU = matrixUlti.deepCopy2DArray(u)
  // v: centers // Example [{price, categoryValue, soldAmount},...]
  let v = new Array(maxI)

  console.log('before iterate');
  console.log('u######');
  for (let [idx, cluster] of u.entries()) {
    console.log('%%%%%cluster ' + idx);
    for (let productId in cluster) {
      console.log((await productService.getProductById(productId)).name + ': ' + cluster[productId]);
    }
  }
  // console.log('u_');
  // console.log(JSON.stringify(u_,null,2));


  // start iterate
  let count = 0;
  let prevV = null
  while (1) {
    console.log('-----------------------');
    console.log(++count);

    //calc centers v 
    for (let i = 0; i < maxI; i++) {
      let numerator = null, denominator = 0;
      for (let product of products) {
        let temp = Math.abs(u[i][product.id] - u_[i][product.id]) ** m
        denominator += temp

        let tempDict = matrixUlti.multiplyDict(product, temp)
        if (!numerator) {
          numerator = tempDict
        } else {
          numerator = matrixUlti.addDict(numerator, tempDict)
        }
      }
      v[i] = matrixUlti.multiplyDict(numerator, 1 / denominator)
      // console.log('!!!!!!');
      // console.log('numerator');
      // console.log(numerator);
      // console.log('denominator');
      // console.log(denominator);
    }
    // console.log('**************** v');
    // console.log(JSON.stringify(v,null,2));


    // calc new u
    for (let i = 0; i < maxI; i++) {
      for (let product of products) {
        let temp1 = 0, temp2 = 0;
        for (let j = 0; j < maxI; j++) {
          temp1 += u_[j][product.id]
          // console.log('u_[j][product.id]');
          // console.log(u_[j][product.id]);
          temp2 += (1 / matrixUlti.calcDistance(product, v[j])) ** (1 / (m - 1))
          // console.log('(1/matrixUlti.calcDistance(product,v[j]))**(1/(m-1))');
          // console.log((1/matrixUlti.calcDistance(product,v[j]))**(1/(m-1))==Infinity ? 10**30 : (1/matrixUlti.calcDistance(product,v[j]))**(1/(m-1)));
        }
        u[i][product.id] = u_[i][product.id] + (1 - temp1) * ((1 / matrixUlti.calcDistance(product, v[i])) ** (1 / (m - 1))) / temp2
        // if(u[i][product.id]==Infinity){
        //   console.log('u element = infi');
        //   console.log('(1-temp1)*((1/matrixUlti.calcDistance(product,v[i]))**(1/(m-1)))/temp2');
        //   console.log((1-temp1)*((1/matrixUlti.calcDistance(product,v[i]))**(1/(m-1)))/temp2);
        //   console.log('(1-temp1)');
        //   console.log((1-temp1));
        //   console.log('((1/matrixUlti.calcDistance(product,v[i]))**(1/(m-1)))');
        //   console.log(((1/matrixUlti.calcDistance(product,v[i]))**(1/(m-1))));
        //   console.log('matrixUlti.calcDistance(product,v[i])');
        //   console.log(matrixUlti.calcDistance(product,v[i]));
        //   console.log('temp2');
        //   console.log(temp2);
        // }
        // console.log('1111');
        // console.log(u_[i][product.id]);
        // console.log('2222');
        // console.log((1-temp1)*((1/matrixUlti.calcDistance(product,v[i]))**(1/(m-1)))/temp2);
      }
    }
    // console.log('+++++ u');
    // console.log(JSON.stringify(u,null,2));

    // stop condition


    // stop on u change
    let maxError = -10000;
    for (let i = 0; i < u.length; i++) {
      for (let k in u[i]) {
        const error = Math.abs(u[i][k] - prevU[i][k])
        if (error > maxError) {
          maxError = error
        }
      }
    }
    console.log('maxError');
    console.log(maxError);
    if (maxError < 0.001) {
      break;
    }
    prevU = matrixUlti.deepCopy2DArray(u)


    // stop on v change
    // let maxDif = -100
    // if(prevV){
    //   for(let [idx,center] of v.entries()){
    //     let dif = matrixUlti.calcDistance(v[idx], prevV[idx])
    //     // console.log('dif==' + dif);
    //     if(dif > maxDif){
    //       maxDif = dif
    //     }
    //   }
    //   if(maxDif<0.00001){
    //     console.log('maxdif: ' + maxDif);
    //     break
    //   }
    // }

    // prevV = matrixUlti.deepCopy2DArray(v)

  }
  console.log('iterate^^^^^: ' + count);

  console.log('after iterate================');
  // console.log(JSON.stringify(u,null,2));
  for (let [idx, cluster] of u.entries()) {
    console.log('%%%%%cluster ' + idx);
    for (let productId in cluster) {
      console.log((await productService.getProductById(productId)).name + ': ' + cluster[productId]);
    }
  }
  console.log('$$$$$$$$ v');
  console.log(JSON.stringify(v, null, 2));

  // [maxI] of {productId1:{name, membership}, productId2:{name, membership},...}
  let cluster_products = new Array(maxI)
  for (let i = 0; i < maxI; i++) {
    cluster_products[i] = {}
  }

  // {productId1: 1, productId2: 2} which means that productId1 belongs to cluster 1
  let product_cluster = {}
  for (let product of products) {
    let maxMembership = -1
    let belongedTo = null;
    for (let [idx, cluster] of u.entries()) {
      if (cluster[product.id] > maxMembership) {
        maxMembership = cluster[product.id]
        belongedTo = idx
      }
    }
    product_cluster[product.id] = belongedTo
    cluster_products[belongedTo][product.id] = { name: product.name, membership: maxMembership }
  }
  console.log('*****product_cluster');
  console.log(JSON.stringify(product_cluster, null, 2));
  console.log('&&&&&cluster_products');
  // console.log(JSON.stringify(cluster_products));
  for (let [idx, cluster] of cluster_products.entries()) {
    console.log('///////////cluster ' + idx);
    console.log(JSON.stringify(cluster, null, 2));
  }

  const recommendedProducts = []  // [{id, detail:{name, membership}},...]
  for (let productId of boughtProducts) {
    const belongedTo = product_cluster[productId]
    if (u[belongedTo][productId] < initMembership + 0.01) {
      continue
    }
    console.log('push in recommended products');
    for (let prdct in cluster_products[belongedTo]) { // prdct = productId
      if (cluster_products[belongedTo][prdct].membership > initMembership) {
        recommendedProducts.push({ id: prdct, detail: cluster_products[belongedTo][prdct] })
        console.log({ id: prdct, detail: cluster_products[belongedTo][prdct] });
      }
    }

  }
  console.log('total recommended products');
  console.log(JSON.stringify(recommendedProducts, null, 2));

  // const filter = {_id: {$in: recommendedProducts.map((product)=>product.id)}}
  // const res = await productService.queryProducts(filter, {})
  // console.log('|||||res');
  // console.log(JSON.stringify(res,null,2));

  const user = await userService.updateUserById(uid, { recommendedProducts: recommendedProducts.map((product) => product.id) })
  res.status(httpStatus.NO_CONTENT).send();
}

/**
 * 
 * @param {Object} req.auth {uid, name,...} 
 * @param {Object} req.url qs of options Object
 */
async function getRecommendedProducts(req, res) {
  const user = await userService.getUserById(req.auth.uid)
  const filter = { _id: { $in: user.recommendedProducts } }
  const options = qs.parse(req.url.split('?')[1]);
  const result = await productService.queryProducts(filter, options)
  res.send(result)
}

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  genRecommendedProducts,
  getRecommendedProducts,
  subcribeNotifications,
  setHasReadAllNotis,
  fetchNotis
};
