const catchAsync = require('../utils/catchAsync');
const Review = require('../models/reviewModel');
const AppError = require('./../utils/appError');

exports.getAllReview = catchAsync(async (req, res, next) => {
  const reviews = await Review.find();

  if (!reviews) return next(new AppError('Cannot get reviews try again', 400));

  res.status(200).json({
    status: 'success',
    data: { reviews }
  });
});

exports.createNewReview = catchAsync(async (req, res, next) => {
  const review = await Review.create(req.body);

  if (!review)
    return next(new AppError('Review cannot be created, try again', 400));

  res.status(201).json({
    status: 'success',
    data: { review }
  });
});
