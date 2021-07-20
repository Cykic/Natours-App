const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgetpassword', authController.forgetpassword);
router.patch('/resetpassword/:token', authController.resetpassword);
router.patch(
  '/updatePassword',
  authController.protected,
  authController.updatePassword
);
router.patch('/updateMe', authController.protected, userController.updateUser);
router.delete('/deleteMe', authController.protected, userController.deleteUser);

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
