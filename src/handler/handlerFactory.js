const catchAsync = require('../error/catchAsync');
const AppError = require('../error/appError');
const filterObj = require('../../utils/filterObj');
const APIFeatures = require('../../utils/apiFeatures');

// DELETE ONE
exports.deleteOne = Model => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({ status: 'success', data: null });
  });
};

// UPDATE ONE
exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    console.log(req.file);
    console.log(req.body);

    const doc = await Model.findByIdAndUpdate(req.user.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doc) {
      return next(new AppError('No doc found with that ID', 404));
    }

    res.status(200).json({ status: 'success', data: { doc } });
  });

// CREATE ONE
exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    // Error to create New doc
    if (!doc)
      return next(new AppError('Cannot Create new Tour, try again', 400));

    res.status(201).json({
      status: 'success',
      data: { doc }
    });
  });

//   GET ONE
exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;
    // doc.findOne({ _id: req.params.id })

    if (!doc) {
      return next(new AppError('No doc found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { doc }
    });
  });

// GET ALL
exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query;
    // const doc = await features.query.explain();

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: { data: doc }
    });
  });
// C.R.U.D OF USER
exports.updateUser = Model =>
  catchAsync(async (req, res, next) => {
    // 1.) Prevent password update
    if (req.body.password || req.body.passwordConfirm) {
      return next(new AppError('This route is not for password update', 400));
    }
    // 2.) Get user by id
    const filteredBody = filterObj(req.body, 'name', 'email');

    if (req.file) filteredBody.photo = req.file.filename;
    const updatedUser = await Model.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      { new: true, runValidator: true }
    );

    // 3.) Update current user
    res.status(200).json({
      status: 'success',
      message: 'User Successfully Updated',
      data: { user: updatedUser }
    });
  });

exports.deleteUser = Model =>
  catchAsync(async (req, res, next) => {
    await Model.findByIdAndUpdate(req.user.id, { active: false });
    res.status(200).json({
      status: 'success',
      data: null
    });
  });
