const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Booking = require('./../models/bookingsModel');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get all tour data from collection
  const tours = await Tour.find();
  // 2) Build the pug template

  // 3) Render the template using the tour data from step one
  res.status(200).render('overview', {
    title: 'All tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get data for requested tour
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  }
  // 2) Build the template

  // 3) Render template using the data
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLoginForm = catchAsync(async (req, res) => {
  res.status(200).render('login', {
    title: `Login into your account`,
  });
});

exports.getAccoount = (req, res) => {
  res.status(200).render('account', {
    title: `Your account`,
  });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name: req.body.name, email: req.body.email },
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(200).render('account', {
    title: `Your account`,
    user: user,
  });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // 2) FInd tours with the returned id's
  const tourIds = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIds } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});
