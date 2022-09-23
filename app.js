const express = require('express');
const path = require('path'); //module to help with paths
const morgan = require('morgan');
const csp = require('express-csp');
const compression = require('compression'); //npm i compression
const cors = require('cors'); //npm i cors
//cors is for cross origin
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewsRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const AppError = require('./routes/utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const bookingController = require('./controllers/bookingController');

const app = express();

app.enable('trust proxy');
//if you still get uhoh, i think it has to do with this and headers for create send token
//allows the createSendToken to work properly with Heroku

//npm install pug
//Template Engine, don't need to require pug, happens behind the scense

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views')); //helps find the path to the views folder, helps to eliminate double slashes etc
//(1) GLOBAL MIDDLEWARES
// Implement CORS, has to do with headers, documentation is on GitHub
app.use(cors()); //if you just wanted it on Tours, add to the roughte like a normal midleleware
// Access-Control-Allow-Origin *
//api.natours.com, front-end natours.com
// app.use(
//   cors({
//     origin: 'https://www.natours.com',
//   }));

//to test cors, go to empy page, inspect, console,
//const x = await fetch('https://natours-by-cass.herokuapp.com/api/v1/tours')
//and see the response, fetch is plain JS so can be directly written into browser
//options is just like app.get, app.delete, etc
//http request to respond to
app.options('*', cors());
//this is saying all routes, with cors as the handler
//could do it on a specific route i.e. app.options('/api', cors())

// Serving static files
// app.use(express.static(`${__dirname}/public`)); uses the path module below as same thing
app.use(express.static(path.join(__dirname, 'public')));
//this connects template to routes, so really is get requests, requests style.css for template, this directs to where the sheet is held and returns it

const port = process.env.PORT || 3000;

//Set security HTTP headers
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'https:', 'http:', 'data:', 'ws:'],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'http:', 'data:'],
      scriptSrc: ["'self'", 'https:', 'http:', 'blob:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:', 'http:'],
    },
  })
);
csp.extend(app, {
  policy: {
    directives: {
      'default-src': ['self'],
      'style-src': ['self', 'unsafe-inline', 'https:'],
      'font-src': ['self', 'https://fonts.gstatic.com'],
      'script-src': [
        'self',
        'unsafe-inline',
        'data',
        'blob',
        'https://js.stripe.com',
        'https://*.mapbox.com',
        'https://*.cloudflare.com/',
        'https://bundle.js:8828',
        'ws://localhost:56558/',
      ],
      'worker-src': [
        'self',
        'unsafe-inline',
        'data:',
        'blob:',
        'https://*.stripe.com',
        'https://*.mapbox.com',
        'https://*.cloudflare.com/',
        'https://bundle.js:*',
        'ws://localhost:*/',
      ],
      'frame-src': [
        'self',
        'unsafe-inline',
        'data:',
        'blob:',
        'https://*.stripe.com',
        'https://*.mapbox.com',
        'https://*.cloudflare.com/',
        'https://bundle.js:*',
        'ws://localhost:*/',
      ],
      'img-src': [
        'self',
        'unsafe-inline',
        'data:',
        'blob:',
        'https://*.stripe.com',
        'https://*.mapbox.com',
        'https://*.cloudflare.com/',
        'https://bundle.js:*',
        'ws://localhost:*/',
      ],
      'connect-src': [
        'self',
        'unsafe-inline',
        'data:',
        'blob:',
        `wss://natours-by-cass.herokuapp.com:${port}/`,
        'https://*.stripe.com',
        'https://*.mapbox.com',
        'https://*.cloudflare.com/',
        'https://bundle.js:*',
        'ws://localhost:*/',
      ],
    },
  },
});

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//we use this to limit  the reuqests from a single IP
const limiter = rateLimit({
  max: 100, //100 requests per hour
  windowMs: 60 * 60 * 1000, //converting from milleseconds
  message: 'Too many requests from this IP, please try again in an hour',
});

app.use('/api', limiter); //this middleware will only be applied to the api route

app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
);

//Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); //middleware allows you to get incoming data
app.use(express.urlencoded({ extended: true, limit: '10kb' })); //middleware that parses data coming from a form
app.use(cookieParser());

//Data sanitization against NoSQL query injection
//doesnt let a person use NoSQL commands to filter i.e. $ge mongo db operators
app.use(mongoSanitize());
//Data sanitization against XSS

app.use(xss()); //cleans input of malicious html code with JS code attatched

//Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      //what we would allow for duplication
      'duration',
      'ratingsQuanitity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.use(compression());

//using next shows we are defining a middleware function
app.use((req, res, next) => {
  console.log('Hello from the middleware 😆');
  //have to call next since it is middleware
  next();
});

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies); //will show cookies with every request
  //use cookies to protect routes
  // console.log(req.headers);
  //postman create Authorization Header
  //Bearer at front is common practice
  next();
});

/// (2) ROUTE HANDLERS

// (3) ROUTES

//this is a middleware
//const userRouter = express.Router();

//mounting routers on routes because they are middleware
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/', viewsRouter);
//* means everything
//this is to catch wrong url routes
app.all('*', (req, res, next) => {
  // // res.status(404).json({
  // //   status: 'fail',
  // //   message: `Can't find ${req.originalUrl} on this server`,
  // // });
  // const err = new Error(`Can't find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;
  // next(err); //if error, will jump to error handling middleware
  next(new AppError(`Can't find ${req.originalUrl} on this server`), 404);
});
//GLOBAL ERROR HANDELING MIDDLEWARE
app.use(globalErrorHandler);

//on package.json ^10 means you can't install greated thna this version

module.exports = app;
// (4) START SERVER
