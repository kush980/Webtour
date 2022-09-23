const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
// const reviewController = require('../controllers/reviewController');

const reviewRouter = require('./reviewRoutes');
const router = express.Router();

//NESTED ROUTES
// POST /tour/tour_id/reviews
// GET /tour/tour_id/reviews
// GET /tour/tour_id/reviews/review_id

// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );
//this is messy because now the review is nested in the tour route, so using express's merge params

//So the tour id is in the url, the current user is the ascociated user,
//and the review will now be ascociated with both.
//All you have to enter is the rating and review for the post
router.use('/:tourId/reviews', reviewRouter); //this just says use this rouyer if this is the request

//remember, router is middleware so we can use 'use'

// router.param('id', tourController.checkID);
//this above middleware is run last as the otherones in app.js come before the routes

//want the url query to look like
//limit=5&sort=ratingsAverage,price
//so soultion is to use middleware
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);
router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );
//new way to specify url that takes a lot of option
//center is the point where you live
// router
//   .route('/tours-within/:distance/center/:latlng/unit/:unit')
//   .get(tourController.getToursWithin);
//other way : '/tours-within?distance=2336&center=-40,456&unit=mi'
// /tours-within/233/center/-40,45/unit/mi

// router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);
router
  .route('/')
  //only lets logged in users see this
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );
// .post(tourController.checkBody, tourController.createTour);
//middleware functions  are createTour, getAllTours, etc
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect, //first
    authController.restrictTo('admin', 'lead-guide'), //second
    tourController.deleteTour //third
  );

module.exports = router;
