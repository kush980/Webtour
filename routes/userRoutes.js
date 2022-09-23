const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router(); //since router is basically a small app, can apply middleware to it

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout); //it is a get request because we are just getting a new cookie to replace the login

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.use(authController.protect);
// this is a middleware we are applying so that protect is applpied to all of these routes
//remeber middleware runs in order, so the first 4 will rrun, and now the next middlewares will be protected following this one
router.patch(
  '/updateMyPassword',
  authController.protect,
  authController.updatePassword
);
router.delete('/deleteMe', userController.deleteMe);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.route('/me').get(userController.getMe, userController.getUser);

//npm i multer

//adds the current user's id to the url for the getUser
//REMEBER IN POSTMAN, AUTH IS BEARER TOKEN which is token from login, for login, do TESTS IS pm.environment.set("jwt", pm.response.json().token);
//saving the token in TESTS, allows you to track time and updates, so need it for updating, logging in, changing, etc
router.use(authController.restrictTo('admin')); //now only admin can be doing the following
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
