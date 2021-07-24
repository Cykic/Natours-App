const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true }); //allows :tourId

router
  .route('/')
  .get(authController.protected, reviewController.getAllReview)
  .post(
    authController.protected,
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createNewReview
  );

router
  .route('/:id')
  .patch(reviewController.updateReview)
  .delete(reviewController.deleteReview);
module.exports = router;
