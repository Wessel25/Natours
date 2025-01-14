const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const reviewController = require('./../controllers/reviewController');

//name, email, photo, password, passwordConfirm.

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    unique: true,
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      //Note: This only works on "CREATE", "SAVE", so implementation code needs to keep this in mind for authorization
      validator: function (val) {
        return val === this.password;
      },
      message: 'Password confirmation mismatch!',
    },
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.pre('save', async function (next) {
  //Only run this copde when the password is modified
  if (!this.isModified('password')) {
    return next();
  }
  //Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  //Delete the passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

//Instance Method (Basically on each collection this method is available for use) i.e., this points to the current document
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestap) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );

    console.log(changedTimeStamp, JWTTimestap);
    return JWTTimestap < changedTimeStamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  //Generating token that will be send to the requested user endpoint
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpired = Date.now() + 10 * 60 * 1000;
  console.log(
    'Reset token created and will expire at: ' +
      this.passwordResetExpired +
      'resetToken: ' +
      resetToken +
      'passwordResetToken: ' +
      this.passwordResetToken,
  );
  return resetToken;
};

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }
  //Making this 1sec in the past because the JWT token might be created a bit earlier so to ensure everything is working fine we add 1 sec
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//Creating a Model out of the User (userSchema)
const User = mongoose.model('User', userSchema);

module.exports = User;
