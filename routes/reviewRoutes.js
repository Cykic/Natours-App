const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

const router = express.Router();

router
  .route('/')
  .get(authController.protected, reviewController.getAllReview)
  .post(authController.protected, reviewController.createNewReview);

module.exports = router;
