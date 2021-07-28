const express = require('express');
const tourController = require('./tourController');
const authController = require('../auth/authController');
const reviewRouter = require('../review/reviewRoutes');

const router = express.Router();

// router.param('id', tourController.checkID);

router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-cheap')
  .get(
    tourController.aliasTopTours,
    authController.protected,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.getAllTours
  );

router
  .route('/tour-stats')
  .get(
    authController.protected,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.getTourStats
  );
router
  .route('/monthly-plan/:year')
  .get(
    authController.protected,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.getMonthlyPlan
  );
router
  .route('/tour-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getTourWithin);

router
  .route('/')
  .get(authController.protected, tourController.getAllTours)
  .post(
    authController.protected,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protected,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
