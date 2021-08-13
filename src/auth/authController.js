const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../user/userModel');
const catchAsync = require('../error/catchAsync');
const AppError = require('../error/appError');
const Email = require('../../utils/email');
// imports
const generateToken = user =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION
  });

const sendLoginToken = (user, statuscode, res) => {
  const token = generateToken(user);
  const cookieOption = {
    expires: new Date(
      Date.now() + process.env.JWT_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') cookieOption.secure = true;
  // cookie
  res.cookie('jwt', token, cookieOption);

  res.status(statuscode).json({
    status: 'success',
    token
  });
};

// SIGN UP

exports.signup = catchAsync(async (req, res) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    role: req.body.role
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  // Send welcome Email
  await new Email(newUser, url).sendWelcome();

  // CREATED SUCCESSFUL
  sendLoginToken(newUser, 201, res);
});

// LOGIN

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // check if email and password parameters exist
  if (!email || !password) {
    return next(new AppError('Please enter a valid email and password', 400));
  }

  // check if the email and password parameters match any existing user
  const user = await User.findOne({ email }).select('+password');
  if (!user) return next(new AppError('No Account found for this Email', 404));

  const isPasswordCorrect = await user.correctPassword(password, user.password);
  if (!user || !isPasswordCorrect)
    return next(new AppError('Incorrect Email or Password', 401));

  sendLoginToken(user, 200, res);
});

// LOGOUT

exports.logout = catchAsync(async (_req, res, _next) => {
  res.cookie('jwt', 'logged out', {
    expires: new Date(Date.now() + 1 * 1000),
    httpOnly: true
  });
  res.status(200).json({
    status: 'success'
  });
});

// PROTECTED ROUTES

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

// AUTHORIZATION

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // Check if the user role is part of the role that hass access to the next middleware
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission for this route', 403)
      );
    }
    next();
  };
};

// FORGET PASSWORD

exports.forgetpassword = catchAsync(async (req, res, next) => {
  // Find the email
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError('No User found with this email', 404));

  // Generate randon token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    // send token to email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetpassword/${resetToken}`;
    // use created Email class to send email
    await new Email(user, resetURL).sendPasswordReset();

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

// RESET PASSWORD

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
  sendLoginToken(user, 200, res);
});

// UPDATE PASSWORD

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1.) Get user
  const user = await User.findById(req.user.id).select('+password');
  // 2.) check if password is correctPassword
  const correctPassword = await bcrypt.compare(
    req.body.currentPassword,
    user.password
  );
  if (!correctPassword)
    return next(
      new AppError('current password is incorrect please try again', 401)
    );

  // 3.) if so, update password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save(); // this is because validator only work on save or create

  // 4.) Log in user
  sendLoginToken(user, 200, res);
});
