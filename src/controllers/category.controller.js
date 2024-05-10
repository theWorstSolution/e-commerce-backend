const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { categoryService } = require('../services');
const qs = require('qs')

const createCategory = catchAsync(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  res.status(httpStatus.CREATED).send(category);

  // append newCategory to children of parentCategory
  let parentCategoryId = req.body.ancestors[req.body.ancestors.length-1]
  // console.log('parentCategoryId: '+parentCategoryId);
  let parentCategory = await categoryService.getCategoryById(parentCategoryId)
  parentCategory.children.push(category)
  await parentCategory.save()
  
  // calculate value for newCategory
  // console.log(JSON.stringify(parentCategory));
  const value = parentCategory.value + parentCategory.children.length * (10**(Math.floor(Math.log10(parentCategory.value))-3*category.ancestors.length))
  categoryService.updateCategoryById(category.id, {value})
});

//TODO: modify filter
const getCategories = catchAsync(async (req, res) => {
  const query = qs.parse(req.url.split('?')[1]);
  const filter = query.filter
  const options = query.options
  // console.log(JSON.stringify(filter))
  // console.log(JSON.stringify(options))
  const result = await categoryService.queryCategories(filter, options);
  // const populatedDocs = await Product.populate(result.results,{ path: 'categories', select: 'name' })
  // result.results = populatedDocs;
  res.send(result);
});

const getCategory = catchAsync(async (req, res) => {
  let {id} = req.params
  var category = await categoryService.getCategoryById(id);
  res.send(category);
});

const getChildrenOfCategory = catchAsync(async (req,res)=>{
  let {id} = req.params
  // console.log(id);
  const  parentCategory = await categoryService.getCategoryById(id);
  // console.log(JSON.stringify(parentCategory));
  let populatedParentCat = await parentCategory.populate('children').execPopulate()
  res.send(populatedParentCat.children)
})

const updateCategory = catchAsync(async (req, res) => {
  const category = await categoryService.updateCategoryById(req.params.id, req.body);
  res.send(category);
});



module.exports = {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  getChildrenOfCategory
};
