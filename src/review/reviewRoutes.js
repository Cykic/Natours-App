const express = require('express');
const reviewController = require('./reviewController');
const authController = require('../auth/authController');

const router = express.Router({ mergeParams: true }); //allows :tourId

router.use(authController.protected);

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
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;
