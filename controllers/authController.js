const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('./../utils/email');

const signatureToken = (id) => {
  console.log(`authController.js line: 10 (signatureToken())`);
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  console.log(`authController.js line: 17 (createSendToken())`);
  const token = signatureToken(user._id);

  //Create cookie
  const cookieOptions = {
    expires: new Date( // perDay * perHour * perMinute * milliPerSecond
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };
  //Send cookie
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  res.cookie('jwt', token, cookieOptions);

  //Delete password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'Success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  console.log(`authController.js line: 46 (signup())`);
  const userOptions = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  };

  const newUser = await User.create(userOptions);

  const url = `${req.protocol}://${req.get('host')}/me}`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  console.log(`authController.js line: 57 (login())`);
  const { email, password } = req.body;
  // 1) Check if email and password exists
  if (!email || !password) {
    //Specify return in order to ensure that that the login function finishes right away when error occurs
    return next(
      new AppError(
        'Object Error: authcontroller.js: line 62 Please provide email and password!',
        400,
      ),
    );
  }
  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password'); //Because we have hidden the password, we need to specifically select it back through using"+[field_name]""

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything is ok, send token to client
  createSendToken(user, 200, res);
});

//Middelware to protect against unauthorized users
exports.protect = catchAsync(async function (req, res, next) {
  console.log(`authController.js line: 77 (protect())`);
  let token;
  // 1) Getting token and checking if it's there
  const authorizedBearerToken = req.headers.authorization;
  console.log('RequestHeadersAuthorization:' + req.headers.authorization);
  if (authorizedBearerToken && authorizedBearerToken.startsWith('Bearer')) {
    token = authorizedBearerToken.split(' ')[1];
    console.log(`token: ${token}`);
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (token === null) {
    return next(
      new AppError('You are not logged in! Please login to gain access', 401),
    );
  }

  // 2) Validate the token (jwt algo)
  const verifyToken = promisify(jwt.verify);

  const decodedPayload = await verifyToken(token, process.env.JWT_SECRET);

  console.log(`decodedPayload: ${decodedPayload}`);

  // 3) Check if user still exists
  const currentUser = await User.findById(decodedPayload.id);
  if (!currentUser) {
    return next(new AppError('The user doesnt belong to token!', 401));
  }
  // 4) Check if user changed password after the JWT(*token) was issued
  if (currentUser.changedPasswordAfter(decodedPayload.iat)) {
    return new AppError(
      'User recently changed password! Please log in again',
      401,
    );
  }
  // 5) Grant Access to Protected Route
  req.user = currentUser;
  res.locals.user = currentUser;
  console.log('User: ' + res.locals.user);
  next();
});

//Only for rendered pages, no errors
exports.isLoggedIn = async function (req, res, next) {
  console.log(`authController.js line: 73 (isLoggedIn())`);
  try {
    let token;

    if (req.cookies.jwt) {
      token = req.cookies.jwt;

      const verifyToken = promisify(jwt.verify);
      const decodedPayload = await verifyToken(token, process.env.JWT_SECRET);

      console.log(`decodedPayload: ${decodedPayload}`);

      const currentUser = await User.findById(decodedPayload.id);
      if (!currentUser) {
        return next();
      }

      if (currentUser.changedPasswordAfter(decodedPayload.iat)) {
        return next();
      }

      res.locals.user = currentUser;
      return next();
    }
    next();
  } catch (err) {
    return next();
  }
};

exports.logout = (req, res) => {
  console.log(`authController.js line: 153 (logout())`);
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

//Higher-order function in order to use roles-array within middelware function
exports.restrictTo = (...roles) => {
  console.log(`authController.js line: 165 (restrictTo())`);
  var roles = [...roles];
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action!', 403),
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  console.log(`authController.js line: 177 (forgotPassword())`);
  // 1) Get user based on Posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("Email doesn't exist", 404));
  }
  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // // 3) Send it to user's email
  try {
    // return await sendEmail({
    //   email: user.email,
    //   subject: 'Forgot password token (valid for 10min)',
    //   message: message,
    // });
    const host = req.get('host');
    console.log(req.protocol + ' ' + host);
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    console.log(err);
    // Clean up user fields on email failure
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined; // Fixed typo here
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Please try again later!',
        500,
      ),
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  console.log(`authController.js line: 212 (resetPassword())`);
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  console.log('haskedToken: ' + hashedToken + 'Date: ' + Date.now());
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    // passwordResetExpires: { $gt: Date.now() },
  });
  console.log('Req.params: ' + req.params.token);
  // 2) Set the new password, but only if token hasn't expired and there is a user
  if (!user) {
    return next(new AppError('Your token has expired or is invalid', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update the changedPasswordAt property for the user

  // 4) Log the user in, send JWT
  createSendToken(user, 201, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  console.log(`authController.js line: 241 (updatePassword())`);
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if posted password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Password is incorrect, please try again'), 401);
  }
  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) Log user in, send JWT
  createSendToken(user, 201, res);
});
