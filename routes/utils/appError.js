class AppError extends Error {
  constructor(message, statusCode) {
    //super calls parent constructor
    super(message); //don't have to define
    //message because already done in Erro Class

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    //fail if it starts with a 4, otherwise will be an error
    //voteable = (age < 18) ? "Too young":"Old enough";
    this.isOperational = true; //this is from us
    Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = AppError;
