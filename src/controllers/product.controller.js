const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { productService } = require('../services');
const {categoryService} = require('../services')
const { Product, Order } = require('../models');
const matrixUlti = require('../utils/matrixUlti')
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
  const options = {sortBy: 'name:asc',...query.options}
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

/**
 * 
 * @param {String} uid 
 */
async function genRecommendedProducts(uid){
  console.log(uid)

  // all products = x[]
  let products = await Product.find().select('name price soldAmount rating categories').populate('categories.id')
  let maxPrice = -1, maxSoldAmount = -1, maxCategoryValue = -1, minPrice = Infinity, minSoldAmount = Infinity, minCategoryValue = Infinity
  for(let product of products){
    if(product.price>maxPrice){
      maxPrice = product.price
    }
    if(product.price<minPrice){
      minPrice = product.price
    }
    if(product.soldAmount>maxSoldAmount){
      maxSoldAmount = product.soldAmount
    }
    if(product.soldAmount<minSoldAmount){
      minSoldAmount = product.soldAmount
    }
    if(product.categories[product.categories.length-1].id.value>maxCategoryValue){
      maxCategoryValue = product.categories[product.categories.length-1].id.value
    }
    if(product.categories[product.categories.length-1].id.value<minCategoryValue){
      minCategoryValue = product.categories[product.categories.length-1].id.value
    }
  }
  products = products.map((product)=>{
    return {
      name: product.name,id: product.id,
      price:(product.price-minPrice)/(maxPrice-minPrice),
      soldAmount: (product.soldAmount-minSoldAmount)/(maxSoldAmount-minSoldAmount),
      rating:product.rating/5,
      categoryValue: (Math.log10(product.categories[product.categories.length-1].id.value)-Math.log10(minCategoryValue))/(Math.log10(maxCategoryValue)-Math.log10(minCategoryValue))}
  })
  const boughtProducts = await Order.find({user: uid}).distinct('product')  // ['id1','id2',...]
  console.log('^^^^products after normalize');
  console.log(JSON.stringify(products,null,2));
  const maxI = boughtProducts.length * 2
  const maxK = products.length

  // init u_: [maxI] of productId -> Number all 0
  const u_InitElement = {}
  for(let product of products){
    u_InitElement[product.id] = 0;
  }
  const u_ = []
  for(let i=0;i<maxI;i++){
    u_.push({...u_InitElement})
  }
  // asign each boughtProduct to a separate k
  // console.log('+++u_');
  // console.log(JSON.stringify(u_,null,2));
  let initI = 0
  for(let boughtProduct of boughtProducts){
    u_[initI][boughtProduct] = 0.5
    initI += 1
  }

  // init u: [maxI] of productId -> Number all 1/products.length
  const uInitElement = {}
  for(let product of products){
    uInitElement[product.id] = 1/products.length;
  }
  const u = []
  for(let i=0;i<maxI;i++){
    u.push({...uInitElement})
  }

  const eps = 0.05
  const m = 2
  let prevU = matrixUlti.deepCopy2DArray(u)
  let v = new Array(maxI)

  // console.log('before iterate');
  // console.log('u');
  // console.log(JSON.stringify(u,null,2));
  // console.log('u_');
  // console.log(JSON.stringify(u_,null,2));
  
  
  // start iterate
  let count = 0;
  let prevV = null
  while(1){
    console.log('-----------------------');
    console.log(++count);
    //calc centers v 
    for(let i=0;i<maxI;i++){
      let numerator = null, denominator = 0;
      for(let product of products){
        let temp = Math.abs(u[i][product.id]-u_[i][product.id])**m
        denominator += temp
        
        let tempDict = matrixUlti.multiplyDict(product,temp)
        if(!numerator){
          numerator = tempDict
        }else{
          numerator = matrixUlti.addDict(numerator, tempDict)
        }
      }
      v[i] = matrixUlti.multiplyDict(numerator,1/denominator)
      // console.log('!!!!!!');
      // console.log('numerator');
      // console.log(numerator);
      // console.log('denominator');
      // console.log(denominator);
    }
    // console.log('**************** v');
    // console.log(JSON.stringify(v,null,2));

    
    // calc new u
    for(let i=0;i<maxI;i++){
      for(let product of products){
        let temp1=0, temp2=0;
        for(let j=0;j<maxI;j++){
          temp1 += u_[j][product.id]
          // console.log('u_[j][product.id]');
          // console.log(u_[j][product.id]);
          temp2 += (1/matrixUlti.calcDistance(product,v[j]))**(1/(m-1))
          // console.log('(1/matrixUlti.calcDistance(product,v[j]))**(1/(m-1))');
          // console.log((1/matrixUlti.calcDistance(product,v[j]))**(1/(m-1))==Infinity ? 10**30 : (1/matrixUlti.calcDistance(product,v[j]))**(1/(m-1)));
        }
        u[i][product.id] = u_[i][product.id] + (1-temp1)*((1/matrixUlti.calcDistance(product,v[i]))**(1/(m-1)))/temp2
        if(u[i][product.id]==Infinity){
          console.log('u element = infi');
          console.log('(1-temp1)*((1/matrixUlti.calcDistance(product,v[i]))**(1/(m-1)))/temp2');
          console.log((1-temp1)*((1/matrixUlti.calcDistance(product,v[i]))**(1/(m-1)))/temp2);
          console.log('(1-temp1)');
          console.log((1-temp1));
          console.log('((1/matrixUlti.calcDistance(product,v[i]))**(1/(m-1)))');
          console.log(((1/matrixUlti.calcDistance(product,v[i]))**(1/(m-1))));
          console.log('matrixUlti.calcDistance(product,v[i])');
          console.log(matrixUlti.calcDistance(product,v[i]));
          console.log('temp2');
          console.log(temp2);
        }
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
    for(let i=0;i<u.length;i++){
      for(let k in u[i]){
        const error = Math.abs(u[i][k]-prevU[i][k])
        if(error>maxError){
          maxError = error
        }
      }
    }
    console.log('maxError');
    console.log(maxError);
    if(maxError<0.001){
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
  console.log('iterate^^^^^: '+count);
  
  console.log('after iterate================');
  // console.log(JSON.stringify(u,null,2));
  for(let [idx,cluster] of u.entries()){
    console.log('%%%%%cluster ' + idx);
    for(let productId in cluster){
      console.log((await productService.getProductById(productId)).name + ': ' + cluster[productId]);
    }
  }
  console.log('$$$$$$$$ v');
  console.log(JSON.stringify(v,null,2));
  let cluster_products = new Array(maxI)
  for(let i=0;i<maxI;i++){
    cluster_products[i] = new Array()
  }
  // console.log(';;;;;;;');
  // console.log(JSON.stringify(cluster_products,null,2));
  // cluster_products[0].push(109)
  
  let product_cluster = {}
  for(let product of products){
    let maxMembership = -1
    let belongedTo = null;
    for(let [idx,cluster] of u.entries()){
      // console.log('[[[[[[[');
      // console.log(idx);
      // console.log(cluster);
      if(cluster[product.id]>maxMembership){
        maxMembership = cluster[product.id]
        belongedTo = idx
      }
    }
    product_cluster[product.name] = belongedTo
    // console.log(belongedTo);
    cluster_products[belongedTo].push(product.name)
  }
  console.log('*****product_cluster');
  console.log(JSON.stringify(product_cluster,null,2));
  console.log('&&&&&cluster_products');
  console.log(JSON.stringify(cluster_products,null,2));
}

module.exports = {
  createProduct,
  getProduct,
  getProducts,
  updateProduct,
  genRecommendedProducts
};
