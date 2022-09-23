const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
  },
  email: {
    type: String,
    required: [true, 'A user must have an email'],
    unique: true,
    lowercase: true,
    //not a validatior, just transforms inputed email all lowercase
    //need a validator to validate email
    validate: [validator.isEmail, 'Please provide a valid email'],
    //this custom validator is found in the documentation
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
    minLength: 8,
    select: false, //won't show up in any output for secuitry even if it is encrypted
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your pasword'],
    validate: {
      //this only works on CREATE or SAVE
      //i.e. create new user, update
      validator: function (el) {
        return el === this.password;
        //compares input to already entered password, returns true if match
      },
      message: 'Passwords do not match',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date, //only hve like 10mins to reset password
  active: {
    //for when a user wants to deactivate or delete their account
    type: Boolean,
    default: true,
    select: false,
  },
});

//need encryption so passwords are not in plain text, easy for hackers to steal

//COMMENTED OUT THE BELOW becuase of the virtual variable password in lecture 172

//GOES THUR EACH PRESAVE MIDDLEWARE BEFORE SAVING THE USER, IF TRUE, DO THIS, etc
//this pre save middleware happens in between receiving the data and saving it
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); //only need to encrypt password if changed or new
  //this is the current document, in this case, the user
  //encryption basically adds a random unique string the end to essentially give it a double password
  //installl npm i bcryptjs
  this.password = await bcrypt.hash(this.password, 12); //the higher the number, the more cpu power it takes and better security
  //hash the password with a cost of 12
  //async function so returns a promise
  this.passwordConfirm = undefined;
  //dont need to encrypt both, just have one refrence in the DB so deltes field
  next();
});
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next(); //move on to next middleware, isNew means new doc
  this.passwordChangedAt = Date.now() - 1000; //updates when password was created
  //puts password change 1 second in the past bc data base is slower than creating token, ensures token is created after password is changed in the DB
  next();
});
//Instance method will be available on all documents of a certain collection

//checks if entered password matches the correct password
userSchema.methods.correctPassword = async function (
  candidatePassword, //inputed by user, not hashed so it's ex. coolcool8, bcrypt hashes it
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.passwordChangedAfter = function (JWTTimestamp) {
  //this is JWTTimestamp
  if (this.passwordChangedAt) {
    //have to divide by 1000 to get time stamp, without dividing it is millisecons and secconds
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    ); //puts them in same time format so that u can see if they are the same
    console.log(changedTimestamp, JWTTimestamp);
    return JWTTimestamp < changedTimestamp;
  }
  //false means not changed
  return false;
};
userSchema.pre(/^find/, function (next) {
  //this points to the current query i.e. find user
  this.find({ active: { $ne: false } }); //if you look for active, will show up with no users
  next();
});

userSchema.methods.createPasswordResetToken = function () {
  //this token is a rest password the user can use to reset their password
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  //{resetToken} is an object, tells var name along with its value

  //Used for testing purposes
  // console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //this is 10mins in milleseconds
  return resetToken;
};
const User = mongoose.model('User', userSchema);
module.exports = User;
