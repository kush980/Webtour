const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');
const router = express.Router({ mergeParams: true });

// POST tour/tour_id/reviews so if this is the query, the tour id will be passed in to the reviewRouter
// POST /reviews

// GET /tours/tour_id/reviews, so this will be rerouted to this as well
// need to check if in getReview there is a tourID

router.use(authController.protect);

router
  .route('/')
  //   //only lets logged in users see this
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  )
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .get(reviewController.getReview);

module.exports = router;
