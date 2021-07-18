const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const generateToken = user =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION
  });

exports.signup = catchAsync(async (req, res) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    role: req.body.role
  });

  // creating JWT for signup userModel
  const token = generateToken(newUser);

  // CREATED SUCCESSFUL
  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser
    }
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // check if email and password parameters exist
  if (!email || !password) {
    return next(new AppError('Please enter a valid email and password', 400));
  }

  // check if the email and password parameters match any existing user
  const user = await User.findOne({ email }).select('+password');

  const correctPassword = await bcrypt.compare(password, user.password);
  if (!user || !correctPassword)
    return next(new AppError('Invalid Email or Password', 401));

  const token = generateToken(user);

  res.status(200).json({
    status: 'success',
    token
  });
});

exports.protected = catchAsync(async (req, res, next) => {
  // Get token
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token)
    return next(
      new AppError('You are not Logged in, Login to get access', 401)
    );

  // Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(new AppError('The token for this user does not exist', 401));
  }
  // GRANT ACCESS TO THE PROTECTED ROUTE
  req.user = freshUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission for this route', 403)
      );
    }

    next();
  };
};

exports.forgetpassword = catchAsync(async (req, res, next) => {
  // Find the email
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError('No User found with this email', 404));

  // Generate randon token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // send token to email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetpassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new passowrd and passwordConfirm to ${resetURL}`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password rest token valid for 10min',
      message
    });

    res.status(200).json({
      status: 'success',
      message: ' Token sent to email'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('There was an error while sending mail', 500));
  }
});

exports.resetpassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on tokens
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  // 2) if token expires
  if (!user) {
    return next(new AppError('The token is invalid or has expired', 400));
  }
  // 3) Update chandedPasswordAt property of user
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // Log the user in send JWT
  const token = generateToken(user);

  res.status(200).json({
    status: 'success',
    token
  });
});
