const { userService, reviewService, productService } = require("../services");
const qs = require('qs');



/**
 * 
 * @param {Object} req.body {rating, content, product (id)}
 * @param {*} res 
 * @returns 
 */
async function createReview(req, res) {
    if (!await userService.hasBought(req.auth.uid, req.body.product) || await reviewService.hasReviewed(req.auth.uid, req.body.product)) {
        res.send('cant create'); return
    }

    const review = await reviewService.createReview({ user: req.auth.uid, ...req.body })
    res.send(review)


    const user = await userService.getUserById(req.auth.uid)
    user.reviews.push(review.id)
    await user.save()

    const product = await productService.getProductById(req.body.product)
    product.reviews.push(review.id)
    await product.save()
}


/**
 * 
 * @param {} req.url parse ra duoc {filter, options} 
 * @param {*} res 
 */
async function getReviews(req, res) {
    const query = qs.parse(req.url.split('?')[1]);

    query.options = { sortBy: 'timeCreated', ...query.options }

    const result = await reviewService.queryReviews(query.filter, query.options)
    res.send(result)
}


/**
 * 
 * @param {Object} req.body {rating, content}
 * @param {*} res 
 */
async function updateReview(req, res){
    const {reviewId} = req.params
    const review = await reviewService.getReviewById(reviewId)
	//chỉ cho update rating và content, và phải cùng user
	if(req.auth.uid.toString() != review.user.toString()){
		res.send('permission deny')
		return
	} 
	
	review.rating = req.body.rating
	review.content = req.body.content
	await review.save()
	res.send(review)

}


async function deleteReview(req,res){
	const {reviewId} = req.params
	const review = await reviewService.getReviewById(reviewId)
	//chỉ cho update rating và content, và phải cùng user
	if(req.auth.uid.toString() != review.user.toString()){
		res.send('permission deny')
		return
	} 
	
	// delete review in user
	const user = await userService.getUserById(req.auth.uid)
	for(let [idx,review] of user.reviews.entries()){
		if(review.toString() == reviewId){
			user.reviews.splice(idx,1)
			break
		}
	}
	await user.save()
	
    //delete review in product
	const product = await productService.getProductById(review.product)
	for(let [idx,review] of product.reviews.entries()){
		if(review.toString() == reviewId){
			product.reviews.splice(idx,1)
			break
		}
	}
	await product.save()

	const result = await review.remove()
	res.send(result)
}


module.exports = {
    createReview,
    getReviews,
    updateReview,
    deleteReview
};