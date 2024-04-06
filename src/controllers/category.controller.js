const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { categoryService } = require('../services');

// body ko cần có rootId trong ancestor
const createCategory = catchAsync(async (req, res) => {
  req.body.ancestors.unshift(categoryService.rootCategoryId)
  const category = await categoryService.createCategory(req.body);
  let parentCategoryId = req.body.ancestors[req.body.ancestors.length-1]
  console.log('parentCategoryId: '+parentCategoryId);
    let parentCategory = await categoryService.getCategoryById(parentCategoryId)
    parentCategory.children.push(category)
    parentCategory.save()
  
  res.status(httpStatus.CREATED).send(category);
});

//TODO: modify filter
const getCategories = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await categoryService.queryCategories(filter, options);
  console.log(result)
  res.send(result);
});

const getCategory = catchAsync(async (req, res) => {
  let {id} = req.params
  if(id=='root'){
    res.send(categoryService.rootCategory)
    return
  }
  var category = await categoryService.getCategoryById(id);
  res.send(category);
});

const getChildrenOfCategory = catchAsync(async (req,res)=>{
  let {id} = req.params
  console.log(id);
  var parentCategory;
  if(id=='root'){
    parentCategory = await categoryService.getRootCategory()
  }else{
    parentCategory = await categoryService.getCategoryById(id);
  }
  // console.log(JSON.stringify(parentCategory));
  let populatedParentCat = await parentCategory.populate('children').execPopulate()
  res.send(populatedParentCat.children)
})

const updateCategory = catchAsync(async (req, res) => {
  const category = await categoryService.updateCategoriesById(req.params.id, req.body);
  res.send(category);
});



module.exports = {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  getChildrenOfCategory
};
