const express = require('express');
const userController = require('./userController');
const authController = require('../auth/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgetpassword', authController.forgetpassword);
router.patch('/resetpassword/:token', authController.resetpassword);

// ACCESS CONTROL TO PROTECTED ROUTES
router.use(authController.protected);

router.patch('/updatePassword', authController.updatePassword);

router.route('/getMe').get(userController.getMe, userController.getUser);

router.patch('/updateMe', userController.updateUser);

router.delete('/deleteMe', userController.deleteUser);

// RESTRICT ROUTES TO ONLY ADMIN
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteOne);

module.exports = router;
