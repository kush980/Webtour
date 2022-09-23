const fs = require('fs');

const Review = require('../models/reviewModels');

const APIFeatures = require('../routes/utils/apiFeatures');

// const catchAsync = require('../routes/utils/catchAsync');
const AppError = require('../routes/utils/appError');

const factory = require('./handlerFactory');

// //create new review
// exports.createReview = catchAsync(async (req, res, next) => {
//   //awaits catchAsysc to see if there are any errors

//   //Allow nested routes
//   if (!req.body.tour) req.body.tour = req.params.tourId;
//   // ^^^ this is saying if the tour id is not in the body, it is in the url
//   /// req.params will get the id from the url
//   if (!req.body.user) req.body.user = req.user.id; //we get the req.user from the protect middleware
//   const newReview = await Review.create(req.body);
//   res.status(201).json({
//     status: 'success',
//     data: {
//       review: newReview,
//     },
//   });
// });

//we are creating this middleware before the factory create handler
//so this will be in the review routes, and run before the create factory
exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};
// exports.getAllReviews = catchAsync(async (req, res, next) => {
//   //this is for nested routing and condensing the routes and rerouting to review routes
//   //so if there is a tour id, only the reviews of that tour id will be shown
//   let filter = {};
//   if (req.params.tourId) filter = { tour: req.params.tourId };
//   //if not, the filter will be an empty object and all reviews will be shown
//   const reviews = await Review.find(filter);

//SEND RESPONSE
// res.status(200).json({
//   status: 'success',
//   results: reviews.length,
//   data: {
//     reviews,
//   },
// });

//{{URL}}/api/v1/reviews?rating[gte]=4.1 noqw works because of the api features now located in the factory handler
exports.getAllReviews = factory.getAll(Review);
exports.createReview = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.getReview = factory.getOne(Review);
