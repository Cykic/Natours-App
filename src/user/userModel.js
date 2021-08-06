const crypto = require('crypto');
const mongoose = require('mongoose');
// const slugify = require('slugify');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A name must be provided']
  },
  email: {
    type: String,
    required: [true, 'A email must be provided'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email address']
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'guide', 'lead-guide'],
    default: 'user'
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  password: {
    type: String,
    required: [true, 'A password must be provided'],
    minlength: 3,
    select: false
  },
  confirmPassword: {
    type: String,
    required: [true, 'A confirm password must be provided'],
    validate: {
      // This vallidator work on create and save method
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same'
    }
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordChangedAt: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password')) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Password encryption
userSchema.pre('save', async function(next) {
  // is the password fiedl is not added skip
  if (!this.isModified('password')) return next();

  // hash password at cost
  this.password = await bcrypt.hash(this.password, 12);
  // makes confirmPassword field not added to the Database
  this.confirmPassword = undefined;
  next();
});

userSchema.methods.createPasswordResetToken = function() {
  // 1) Create random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  // 2) save hased token to database of the user
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  // 3) Save expirey time to database
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};
userSchema.methods.correctPassword = async function(password, inputPassword) {
  const correctPassword = await bcrypt.compare(password, inputPassword);
  return correctPassword;
};

const User = mongoose.model('user', userSchema);

module.exports = User;
