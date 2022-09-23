const jwt = require('jsonwebtoken'); //npm i jsonwebtoken
// const util = require('util'); //use promisfy from so below is the same, es6
// const { promisify } = require('util');
const { promisify } = require('util');
const crypto = require('crypto');
const User = require('../models/userModel');
const catchAsync = require('../routes/utils/catchAsync');
const AppError = require('../routes/utils/appError');
const Email = require('../routes/utils/email');

// eslint-disable-next-line no-multi-assign
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// eslint-disable-next-line no-multi-assign
const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      //converts to milleseconds
    ),
    // secure: true, //can only be sent thru https and only in production
    httpOnly: true,
    secure: req.secure || req.headers('x-forwarded-proto') === 'https',
    //cannot maniuplate in the browser so for log out we are going to create new token sthat overrides the login one
  };
  //this change is very heroku specific
  // if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  //removes the password from being visable in the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
// heroku run node --trace-warnings ...
exports.signup = catchAsync(async (req, res, next) => {
  // const newUser = await User.create(req.body);
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  // const url = 'http://127.0.0.1:3000/me'; would only work in dev
  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();

  //logs in new user using the JWT, don't need to check password or email since user was just created
  createSendToken(newUser, 201, req, res);
});
//refactors the commented out code below
//https://jwt.io/ go to here to debug the token and see what's being passed through
//shows the id of the user, delete the id and iat to have signiture verified
//   res.status(201).json({
//     status: 'success',
//     token,
//     data: {
//       user: newUser,
//     },
//   });
// });

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //  const email = req.body.email is the same but above is new syntax

  // 1) Check if email and password exists
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  // 2) Check is user exists && password is correct
  const user = await User.findOne({ email }).select('+password'); //same as { email: email }
  //user is a document
  //('+password', since password is selct:false, this allows us to see it)
  //passes in entered password and compares
  //correctPassword function is found in userModel
  //correct password is encrypted so the only way to match the correct with the one entered is if
  //we encrypt the entered password, using bcrypt package in the user model
  //('pass1234')===' fbkbdrkkerbujerbjdbjh84##Rdefsjkbuhjnj'

  if (!user || !(await user.correctPassword(password, user.password))) {
    //if user doesnt exist or password doesnt match
    return next(new AppError('Incorrect email or password', 401));
  }
  // 3) If everything okay, send token to client
  createSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000), //10 seconds
    httpOnly: true, //now need to add to user routes
  }); //loggedout is dummy text to replace the token from login cookie above
  //same name as login token bc we are replacing login cookie with this to override
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting the token and check if it is there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]; //bearer <token> in header so splits at space and wants second element
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    // console.log(token);
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2) Validate and verify the token, checks if token is expired or data was manipulated
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //It just takes a function that normally takes a callback and turns it into a Promise instead.
  //calls function and creates a promise, check how works on jwt.io
  // console.log(decoded); //decoded gives the id and expiration of the token

  // 3) Check if user still exists, i.e. password was changed, user deleted, etc
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user no longer exists', 401));
  }
  // 4) Check if user changed password after the token was issued
  if (currentUser.passwordChangedAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password. Please log in again', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});
//this is not to protect routes but for rendered pages, no errors
//had to remove catch aysnc for errors related to matching the jwt during logout

//Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  //similar to protect route but don't need the header portion because that is just for the api
  if (req.cookies.jwt) {
    //checks if cookie is in proper format, if not moves on to next middleware
    try {
      // 1) Verifies the token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        // return next(new AppError('The user no longer exists', 401));
        return next();
      }
      // 3) Check if user changed password after token was issued
      if (currentUser.passwordChangedAfter(decoded.iat)) {
        return next(
          new AppError(
            'User recently changed password. Please log in again',
            401
          )
        );
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      //makes the data of this user acessible when using the templates, varibale user
      // passes data into template like with render function
      return next();
    } catch (err) {
      return next();
    } //this says no logged in user, moves to next middleware
  }
  next(); //no cookie, no logged in user, no access to a user, move on
};

exports.restrictTo = (...roles) => {
  //creates an array of the roles that are options, es6
  return (req, res, next) => {
    console.log(req.user.role);
    //roles is an array i.e. ['admin', 'lead-guide'] say role='user', not in array and therefore doesnt have access
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POST email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address', 404));
  }
  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); //without this, comes back saying need valid email and password

  //User can click on link to reset password
  //req.protocol signifies if it is http or https

  // const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\n If you didn't forget your password, please ignore this email!`;

  //need to do a try catch block because we can't just send a gloabl error message, will need to send back the reset token
  //need to reset token and time it expires if error
  // await sendEmail({
  //   email: user.email, //or req.body.email, same thing
  //   subject: 'Your password reset token (valid for 10 min)',
  //   message,
  // });
  //remeber always need to send a res or the req res cycle will never stop

  // 3) Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.log(err);
    return next(
      new AppError('There was error sending the email. Try again later!', 500)
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  //code in email isdif than code in database so takes code from email and uses crypto to match token in user database
  //finds user with the matched tokens, and need to check if the token has expired (been more than 10min)
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }, //sees if the token time stamp is in the future
  });
  // 2) If token has not expired, and there is a user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetExpires = undefined; //resets the token and expiration
  user.passwordResetToken = undefined;
  await user.save(); //need to put pm.environment.set("jwt", pm.response.json().token); in Tests section of Reset Password
  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(user, 200, req, res);
});
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from the collection
  // This update password is for already logged in user so we have access to their id
  const user = await User.findById(req.user.id).select('+password');
  // 2) Check if POSTed password is correct
  //from userSchema methods, can check if passwords match (remember these methods can be used anywhere)
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401)); //401 is unauthorized
  }
  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm; //will use already built vailadator to make sure they match
  await user.save();
  // 4) Log user in, send JWT
  createSendToken(user, 200, req, res);
});
