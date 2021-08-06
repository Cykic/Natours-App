const express = require('express');
const catchAsync = require('../error/catchAsync');

const router = express.Router();

router.all(
  '/',
  catchAsync(async (req, res, next) => {
    res.redirect('https://documenter.getpostman.com/view/15984587/TzsimQPH');
  })
);

module.exports = router;
