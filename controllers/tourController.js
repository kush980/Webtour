const fs = require('fs');

const multer = require('multer');
const sharp = require('sharp');

const Tour = require('../models/tourModels');
const catchAsync = require('../routes/utils/catchAsync');
const AppError = require('../routes/utils/appError');
const factory = require('./handlerFactory');

//images sored in memory
const multerStorage = multer.memoryStorage();

//only alow images to pass through filter
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

//unlike user photo, tour takes 3 photos
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);
//uplad.single(image) for single image, req.file
//upload.array('images', 5) //for 5 images, req.files
//upload.fields for mix

//middleware for resizing photos
exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(req.files);
  //comment this out if isn't working, so starnge
  if (!req.files.imageCover || req.files.images) return next();

  // 1) Cover
  //rememeber to update the tour, the id will be in the params of the url
  // req.body.imageCover = imageCoverFilename;
  //match field in database for updating
  //we are doing this because the update one function takes in req.body, look at it in the handler
  // imageCover like the single image for user upload is still an array
  // imageCover: [
  //   {
  //     fieldname: 'imageCover',
  //     originalname: 'new-tour-1.jpg',
  //     encoding: '7bit',
  //     mimetype: 'image/jpeg',
  //     buffer: <Buffer ff d8 ff e0 00 10 4a 46 49 46 00 01 01 00 00 48 00 48 00 00 ff e1 00 8c 45 78 69 66 00 00 4d 4d 00 2a 00 00 00 08 00 05 01 12 00 03 00 00 00 01 00 01 ... 1857218 more bytes>,
  //     size: 1857268
  //   }
  // ],
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333) //3 to 2 ratio which is super common with images
    .toFormat('jpeg')
    .jpeg({
      quality: 90,
    })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  req.body.images = [];

  await Promise.all(
    //waits for this loop to finish
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      //gets access to the indexes of the images, so it will be -1.jpeg, -2.jpeg, -3.jpeg

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({
          quality: 90,
        })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    })
  );
  next();
});

//const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// exports.checkBody = (req, res, next) => {
//   if (!req.body.price || !req.body.name) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing name or price',
//     });
//   }
//   next();
// };

// SUDO NPM SNPM RUN DEBUG

//for middleware needs next in args
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next(); //will pre-set req.query for getAllTours
};

// exports.getAllTours = catchAsync(async (req, res, next) => {
//   // BUILD QUERY
//   console.log(req.query); //gets url

//   // 1A) Filtering
//   // const queryObj = { ...req.query };
//   // const excludedFields = ['page', 'sort', 'fields', 'limit'];
//   // excludedFields.forEach((el) => delete queryObj[el]);

//   // // 1B) Advanced Filtering
//   // let queryStr = JSON.stringify(queryObj);
//   // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); //reg exp looks fo gte or gt or lt or lte
//   // console.log(JSON.parse(queryStr));
//   //the \b means exaclty and g  is for all occurences
//   //{ difficulty: ‘easy’, duration : {$gte:5}} manually write out query
//   // can just do in URL duration[gte]=5
//   //returns query string as { difficulty: ‘easy’, duration : {gte:5}} so it's missing the $
//   // let query = Tour.find(JSON.parse(queryStr));
//   // 2) Sorting
//   // if (req.query.sort) {
//   //   const sortBy = req.query.sort.split(',').join(' ');
//   //   query = query.sort(sortBy);
//   // } else {
//   //   query = query.sort('-createdAt');
//   // }

//   //sort('price ratingsAverage')

//   // 3) Field Limiting

//   // if (req.query.fields) {
//   //   const fields = req.query.fields.split(',').join(' ');
//   //   // expects string query = query.select('name duration price')
//   //   query = query.select(fields);
//   // } else {
//   //   query = query.select('-__v'); //everything except the v field
//   // }

//   // 4) Pagination
//   // page=2&limit=10 is query = query.skip(10).limit(10) will get to page 2
//   //1-10, page 1, 11-20 page2

//   // const page = req.query.page * 1 || 1;
//   // //trick to convert str to number and then the || 1 sets the default to 1
//   // const limit = req.query.limit * 1 || 100;
//   // const skip = (page - 1) * limit;
//   // query = query.skip(skip).limit(limit);

//   // if (req.query.page) {
//   //   const numTours = await Tour.countDocuments();
//   //   if (skip >= numTours) throw new Error('This page does not exist');
//   // }
//   // EXECUTE QUERY
//   //pass in query so Tour.find is query obj, and then query is the req.query
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   // we now we have all these query methods query.sort().select().skip().limit()
//   // const tours = await query;
//   const tours = await features.query;

//   // SEND RES
//   res.status(200).json({
//     status: 'success',
//     results: tours.length,
//     data: tours,
//   });
// });
exports.getTourStats = catchAsync(async (req, res, next) => {
  //aggregation pipeline
  //to do calculations, we always use the aggregation pipeline
  //manipulate data in steps/stages passed thru using an array
  //mongoDB feature, a ton of documentation
  //each stage is an object so objects inside of objects
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        //mongodb math operator is $avg
        numTours: { $sum: 1 },
        //one will be added to a counter everytime a tour goes throught
        //the pipeline in order to keep track of number of tours
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 }, //1 is for ascending
    }, //sort by ascednding price
    {
      $match: { _id: { $ne: 'EASY' } },
      //remeber id here is difficulty,so not including easy
    },
  ]);

  res.status(200).json({
    status: 'status',
    data: {
      stats,
    },
  });
});
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; //2021
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`), //greater than Jan1, 2012
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        //shows how many tours per month
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0, //makes id no longer show up
      },
    },
    {
      $sort: { numTourStarts: -1 }, //starts with the highest number of tours
      //shows that July has the highest number of tours in 2021
    },
    {
      $limit: 12, //not super useful but just an example to use it
    },
  ]);
  res.status(200).json({
    status: 'status',
    data: {
      plan,
    },
  });
});

// '/tours-within/:distance/center/:latlng/unit/:unit'
// // /tours-within/233/center/-40,45/unit/mi
// exports.getToursWithin = catchAsync(async (req, res, next) => {
//   const { distance, latlng, unit } = req.params;
//   //remember the above is eslint shorthand, will extract these values from the url

//   const [lat, lng] = latlng.split(','); // because it is a string, will split at the comma

// //we need to define the radius for the below center sphere, we do this by dividing our distance by the radius of the earth
// const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; //on the left is miles, the : says else it's km so thats the earth's radius in km
// //radius is in radians and this is show we have to calculate it
// //this is short hand for if the unit is in miles
// if (!lat || !lng) {
//   next(
//     new AppError(
//       'Please provide latitude and longitude in the format lat,lng',
//       400
//     )
//   );
// }

//geospacial operations, operator $geoWithin finds documents that are within a certain distance
//creates a sphere that starts at lat and has a radius of the distance defined
//   const tours = await Tour.find({
//     startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
//   });
//   //also weird, but the needs to be defined by [lng, lat] not the traditional way lat, lng
//   res.status(200).json({
//     status: 'success',
//     results: tours.length,
//     data: { data: tours },
//   });
//   console.log(tours);
// });

// exports.getDistances = catchAsync(async (req, res, next) => {
//   const { latlng, unit } = req.params;
//   const [lat, lng] = latlng.split(',');

//   const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

//   if (!lat || !lng) {
//     next(
//       new AppError(
//         'Please provide latitutr and longitude in the format lat,lng.',
//         400
//       )
//     );
//   }

//   const distances = await Tour.aggregate([
//     {
//       $geoNear: {
//         near: {
//           type: 'Point',
//           coordinates: [lng * 1, lat * 1],
//         },
//         distanceField: 'distance',
//         distanceMultiplier: multiplier,
//       },
//     },
//     {
//       $project: {
//         distance: 1,
//         name: 1,
//       },
//     },
//   ]);

//   res.status(200).json({
//     status: 'success',
//     data: {
//       data: distances,
//     },
//   });
// });

// // exports.getTour = catchAsync(async (req, res, next) => {
// //   const tour = await Tour.findById(req.params.id).populate('reviews');
// //   // const tour = await Tour.findById(req.params.id).populate('guides');
// //   //this populate thing is for refrencing lecture 153, gets the guides with the correspoding user ids
// //   //same as above but turns it into an object

// //   //THIS BELOW WORKS, to make better, created a query middleware in the tourModel.js
// //   // const tour = await Tour.findById(req.params.id).populate({
// //   //   path: 'guides',
// //   //   select: '-__v -passwordChangedAt', //this wont show with the user info
// //   // });
// //   // const tour = await Tour.findById(req.params.id, (err) => {
// //   //Tour.findOne({_id: req.params.id}) is the same
// //   if (!tour) {
// //     return next(new AppError('No tour found with that ID', 404));
// //   }
// //   res.status(200).json({
// //     status: 'success',
// //     data: { tour },
// //   });
// // });

// // exports.createTour = catchAsync(async (req, res, next) => {
// //   //awaits catchAsysc to see if there are any errors
// //   const newTour = await Tour.create(req.body);
// //   res.status(201).json({
// //     status: 'success',
// //     data: {
// //       tour: newTour,
// //     },
// //   });
// // });
exports.getAllTours = factory.getAll(Tour);
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);
//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }
//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// });
