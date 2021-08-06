const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const cors = require('cors');
const docRouter = require('./src/handler/docRoute');

const AppError = require('./src/error/appError');
const errorController = require('./src/error/errorController');
const tourRouter = require('./src/tour/tourRoutes');
const userRouter = require('./src/user/userRoutes');
const reviewRouter = require('./src/review/reviewRoutes');
const bookingRouter = require('./src/booking/bookingRoutes');

const app = express();

// 1) MIDDLEWARES
// Security Headers
app.use(helmet());

// Logging in Dev Environment
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// Body parser
app.use(express.json({ limit: '10kb' }));

// Data Sanitization on NO SQL
app.use(mongoSanitize());

// Data sanitization on XSS Attack
app.use(xss());

// HTTP Parameter Pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'sort',
      'ratingsAverage',
      'ratingQuantity',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

app.use(cors());
app.use(compression());

// Serving Static files
app.use(express.static(`${__dirname}/public`));

// Request response time`
app.use((req, _res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Request Limit
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, Try again in an hour'
});
app.use('/api', limiter);

// 3) ROUTES TO END POINTS
app.use('/', docRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// ERROR PAGE 404
app.all('*', (req, _res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// GLOBAL ERROR HANDLER
app.use(errorController);

module.exports = app;
