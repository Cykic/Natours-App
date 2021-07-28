const User = require('./userModel');
// const APIFeatures = require('./../utils/apiFeatures');
// const AppError = require('./../utils/appError');
const factory = require('../handler/handlerFactory');

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getAllUsers = factory.getAll(User);

exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteUser(User);

exports.deleteOne = factory.deleteOne(User);

exports.getUser = factory.getOne(User);
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
