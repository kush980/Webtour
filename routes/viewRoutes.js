const express = require('express');
const router = express.Router();
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
// const bookingController = require('../controllers/bookingController');
// router.get('/', (req, res) => {
//   res.status(200).render('base', {
//     tour: 'The Forrest Hiker',
//     user: 'Cassandra', //this now allows pug template access to this data, local variables
//   }); //normally use json, but now use render in order to render the template as a response
// });

router.get('/', authController.isLoggedIn, viewsController.getOverview);

router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
router.get('/login', viewsController.getLogin);
router.get('/me', authController.protect, viewsController.getAccount);
router.get(
  '/my-tours',
  // bookingController.createBookingCheckout,
  authController.protect,
  viewsController.getMyTours
);
router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData
);

// router.get('/overview',
// router.get('/tour', (req, res) => {
//   res.status(200).render('tour', {
//     title: 'The Forest Hiker Tour',
//   });
// });

module.exports = router;
