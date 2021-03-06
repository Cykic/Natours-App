const mongoose = require('mongoose');
// const User = require('./userModel');
// const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'review cannot be empty']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'tour',
      required: [true, 'review must belong to a Tour']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'user',
      required: [true, 'review must belong to a User']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name photo'
  });

  next();
});

reviewSchema.statics.calcAverage = function(tourId) {
  this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: '$tour'
      }
    }
  ]);
};

const Review = mongoose.model('review', reviewSchema);

module.exports = Review;
