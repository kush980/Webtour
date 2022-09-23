const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const Review = require('./reviewModels'); this was giving an error with updating the tour with review data
const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour must have less or equal than 40 characters'],
      minlength: [10, 'A tour must have more or equal than 10 characters'],
      // validate: [validator.isAlpha, 'A tour name can only contain characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a max group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, or difficult',
        //[passes in values that are allowed]
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10, //4.66665, 46.665, 47, 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          //custom validator
          //THIS ONLY POINTS TO CURRENT DOC ON new DOUMENT CREATION
          return val < this.price; //100 <200
          //can't give a discoutn greater than the price
        },
        message: 'Discount price {VALUE} should be below the regular price',
      },
    },
    summary: {
      type: String,
      trim: true, // removes whitespace at end and beginning
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON get location based on coordinates
      type: {
        type: String,
        default: 'Point', //for geometry could be line, polygon, etc
        enum: ['Point'],
      },
      coordinates: [Number], //expect an array of numbers, the long, latitude
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      //on compass, it says array, just click on it to see what is in the array
      //so this is for refrencing opposed to the embedding we had done below with the new tour
      //the curly braces here put this in an object which all schema defs need to be in
      { type: mongoose.Schema.ObjectId, ref: 'User' },
      //looks for an object id like "5f87394a4d2fb6b831170e4b", which is a user id
    ],
    //reviews: [
    //to do child refencing, can do above but thats too much so we are going to do
    //virtual populating which is done below
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    //makes virtual properties as part of the JSON output
  }
);

// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });
//Cassandras-MacBook-Air:starter cassandrakornhiser$ node dev-data/data/import-dev-data.js --delete
//Cassandras-MacBook-Air:starter cassandrakornhiser$ node dev-data/data/import-dev-data.js --import
//this is how you update the schema if you add or delete a field or something

//virtual properties for like converting stuff
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
  //will divide the num of days by 7 in order to get number of weeks
  //can't use in a query though
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  //need to specify two fields : the foreign field and the local field
  foreignField: 'tour',
  localField: '_id',
  //the foreignField refrences the field in the other model so in this case the review model
  //so in this case this refers to the tour id in the review
  //localField is where it's going in the current model so the tour id from the review model will be put in the id section of the roue
});

// DOCUMENT MIDDLEWARE:
//runs ONLY before .save() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true }); //lower changes everything to lower case
  //this is the currently processed document
  //creates a slug for each name
  //slugs are string in url that relate to name
  next();
});

//EMBEDDING EXAMPLE, LOOK AT GOOGLE DOC ON NOV 4TH
// //this is something that will happen everytime before saving a tour
// tourSchema.pre('save', async function (next) {
//   //goes thru the array of user ids from the array from the body of the
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   //overwites the array of user ids with the user documents, now shows the users in the guides section of the tour
//   next();
// });

//pre save hook aka pre save middleware
// tourSchema.pre('save', function (next) {
//   console.log('Will save document...');
//   next();
// });
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });
//leep for refrence on diff middleware, both work

//QUERY MIDDLEWARE

//hook is find so this is the 'find hook' so find is used whenever there is a query
//this is always pointng to the current query
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

// Used this middleware to test the .post(/^find)
// tourSchema.post(/^find/, function (docs, next) {
//   console.log(`Query took ${Date.now() - this.start} milliseconds`);
//   //console.log(docs);
//   next();
// });

tourSchema.pre(/^find/, function (next) {
  // so this is the query : const tour = await Tour.findById(req.params.id).
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt', //this wont show with the user info
  });
  next();
  //so now ALL qqueries will populate the guide field with the user info
  //for all the documents
});

//AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({
//     $match: { secretTour: { $ne: true } },
//   });
//   //adds element to beginning of an array
//   //normal JS

//   //console.log(this.pipeline());
//   //this points to the current aggregation object
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
