const Review = require('./reviewModel');
const factory = require('../handler/handlerFactory');

exports.getAllReview = factory.getAll(Review);

exports.getReview = factory.getOne(Review);

exports.createNewReview = factory.createOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);

exports.setTourUserIds = (req, res, next) => {
  // Allow Nested Route
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};
