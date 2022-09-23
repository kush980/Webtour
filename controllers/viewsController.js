const Tour = require('../models/tourModels');
const Booking = require('../models/bookingModel');
const Reviews = require('../models/reviewModels');
const User = require('../models/userModel');
const catchAsync = require('../routes/utils/catchAsync');
const AppError = require('../routes/utils/appError');
//what data will show up on the home page, so this will pass all of the tour data to our template
exports.getOverview = catchAsync(async (req, res) => {
  // 1) Get tour data from collection
  const tours = await Tour.find(); //returns all tours
  res.status(200).render('overview', {
    title: 'All Tours',
    tours, //uses above variable that is holding all of the tours, ES6
  });
});

// 2) Build template

// 3) Render that template using tour data from 1)

exports.getTour = catchAsync(async (req, res, next) => {
  //   const { slug } = req.params;
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });
  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404));
    //Remember this error message masks the actual error so it is not leaked to the client, if you commented this out the actual error message would come through
  }

  //   const reviews = Reviews.find(tour);
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "default-src 'self' https://*.mapbox.com https://*.stripe.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    );
  res.status(200).render('tour', {
    title: tour.name,
    tour, //uses above variable that is holding all of the tours, ES6
  });
});

exports.getLogin = (req, res) => {
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    )
    .render('login', {
      title: 'Log into your account',
    });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id }); //return all bookings belonging to the user id, remebemer, booking requires tour id and user id

  // 2) Find tours with the returned IDs
  const tourIDs = bookings.map((el) => el.tour); //loops thru booking and create an array with the associated tour ids
  const tours = await Tour.find({ _id: { $in: tourIDs } });
  // so the $in operator will find all tours that have ids in the the tourIDs array we just created
  //this is a different solution instead of virtual populate, this is it done manually

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email, //names of these fields were defined in the HTML (account.pug)
      //can't update password like this do to pre save middleware that we have for encrypting the passwords
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });
});
// 1) Get the data, for the requested tour (including the reviews and guides)
//    1b) Guides are already populated, but need to also populate reviews
// 2) Build template
// 3) Render template using data from 1)
