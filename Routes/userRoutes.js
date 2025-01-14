const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

//Creating Router
const router = express.Router();

//Users Section URLS\

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch(
  '/updatePassword',
  authController.protect,
  authController.updatePassword,
);

//From this point forward, all routes will be protected ! ! !
router.use(authController.protect);

router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe,
);
router.get('/me', userController.getMe, userController.getUser);
router.delete('/deleteMe', userController.deleteMe);

//From this point forward, all users are restricted to admin users ! ! !
router.use(authController.restrictTo('admin'));

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
