const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No Document found with that id', 404));
    }

    //Good practice to not send any data back to the client when performing a delete operation
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document found with that id', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        doc: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'Success',
      data: {
        doc: doc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id, popOptions);

    if (popOptions) {
      query = query.populate(popOptions);
    }
    const doc = await query;
    // console.log(req.params); //reading url parameters
    // const id = req.params.id * 1; //Mulitplying a number to a string here because doing this will make it a string (this is how js works when a number gets string that has a number )
    // // const doc = tours.find((el) => el.id === id);
    if (!doc) {
      return next(new AppError('No Document found with that id', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //To allow for Nested GET reviews on tour
    let filter = {};
    if (req.params.tourId) {
      filter = {
        tour: req.params.tourId,
      };
    }
    //Execute the Query
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .pagination(); //Here were creating an instance of the features class!!

    const doc = await features.query.explain();
    //Send Response
    res.status(200).json({
      status: 'Success', //fail or error
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
