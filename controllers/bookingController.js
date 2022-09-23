const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModels');
const Booking = require('../models/bookingModel');
const catchAsync = require('../routes/utils/catchAsync');
const factory = require('./handlerFactory');
//npm i stripe and then secret key from stripe stored in config.env

//works in Dev
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2) Create checkout session
  // const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/`, //home url
    //want a booking to be stored in model after this url
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}`,
    //this abpve extension to the url follows the syntax of what the booking model requires

    success_url: `${req.protocol}://${req.get('host')}/my-tours`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`, //the tour page they were previously on
    customer_email: req.user.email, //becuase protected route, user is accessible thru req.user
    client_reference_id: req.params.tourId,
    line_items: [
      //infor about product user is purchasing
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        amount: tour.price * 100, //convert to cents
        currency: 'usd',
        quantity: 1, //one tour
      },
    ],
  });
  // 3) Create session as response

  res.status(200).json({
    status: 'success',
    session,
  });
});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   const { tour, user, price } = req.query; //avaiable from the above query string/url
//   if (!tour && !user && !price) return next(); //all of these are required to create a booking doc in the model
//   //since this is happenign on the home url, need to go add middleware to the viewRoutes
//   // this below is the route after a credit card is successfully charged
//   // router.get('/', authController.isLoggedIn, viewsController.getOverview);
//   await Booking.create({ tour, user, price });
//   //not trying to send anythin back, just trying to create a new doc in the booking model

//   //now want to remove query string from url as it has sensitive info in it
//   //req.origibalUrl is the current url, ie where the original request came from
//   res.redirect(req.originalUrl.split('?')[0]);
//   // now after split 1st half is just ${req.protocol}://${req.get('host')}/
//   //so now goes back to '/' route which will go thru the middleware, no query string, move to next middleware which is just getOverview which renders the page
// });

const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.line_items[0].amount / 100;
  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  //check this if error
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed')
    createBookingCheckout(event.data.object);
  res.status(200).json({ received: true });
};

exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
