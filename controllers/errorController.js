const AppError = require('../routes/utils/appError');

const handleCastErrorDB = (err) => {
  //these are things taken from the error stack from postman when wrong ID
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};
const handleDuplicateFieldsDB = (err) => {
  const value = err.keyValue.match(/(["'])(\\?.)*?\1/); //from mongo, postman

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
}; //to find the duplicate field value field, reg expression for words in quotes

const handleValidationErrorDB = (err) => {
  //want all the errors in one message
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data ${errors.join('.')}`;
  return new AppError(message, 400);
};

// const handleJWTError = (err) =>
//same thing
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again', 401);
const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again', 401);

const sendErrorDev = (err, req, res) => {
  //orginalUrl is url without host, want to check if thru api or not toknow if we send back a rendered page
  if (req.originalUrl.startsWith('/api')) {
    //API
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
    //if api, sends out error message as JSON
  }
  //instead of else, eslint doesnt require it
  // RENDERED WEBSITE DURING DEV
  console.error('ERROR 🤯', err);
  res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};
const sendErrorProd = (err, req, res) => {
  console.log(err.message);
  //Operational, trusted error, send messgae to client
  //i.e. wrong route

  // A) API
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational || err.code === 11000) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });

      //Programming or other unknown error so we don't want to share what it is with client
    }
    // 1) Log Error
    console.error('ERROR 🤯', err);
    //2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong',
    });
  }

  // B) RENDERED WEBSITE
  //Operational, trusted error, send message to client
  if (err.isOperational || err.code === 11000) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
  }
  console.error('ERROR 🤯', err);

  //Programming or other unknown error so we don't want to share what it is with client
  return res.status(err.statusCode).render('error', {
    title: 'Something went very wrong',
    msg: 'Please try again later',
  });
};
//if not using if and else, make sure to return responses
module.exports = (err, req, res, next) => {
  // console.log(err.stack);
  //gives us error and where it happened
  //set default status code if there isn't one assigned
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    //npm rn start:prod
    let error = { ...err };
    error.message = err.message;
    //deconstruct the error passed from the middleware function
    if (error.kind === 'ObjectId') error = handleCastErrorDB(error);

    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (error.name === 'TokenExpiredError')
      error = handleJWTExpiredError(error);
    if (error._message === 'Validation failed')
      error = handleValidationErrorDB(error);
    sendErrorProd(error, req, res);
  }
};
