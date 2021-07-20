const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

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

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, _res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
