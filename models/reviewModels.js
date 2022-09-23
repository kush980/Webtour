// Review / Rating / CreatedAt / Ref Tour / Ref User

// reviewController.js
// create functions for creating a review, get all reviews
// routes for this

const mongoose = require('mongoose');
const User = require('./userModel');
const Tour = require('./tourModels');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    //makes virtual properties as part of the JSON output, they show up
  }
);

//prevent duplicate reviews

//using indexes (which we did with tours before), makes sure one user one tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  // so this is the query : const tour = await Tour.findById(req.params.id).

  // path: 'user tour', this works for selecting both but he shows this way below
  this.populate({
    path: 'user',
    select: 'name photo',
  }); //this wont show with the user info
  //   }).populate({
  //     path: 'tour',
  //     select: 'name',
  //   }); this is no longer necessary now that we've virtually populated the reviews so now
  next();
  //so now ALL qqueries will populate the guide field with the user info
  //for all the documents
});

//creatign a function that takes in a tour id that the current review belongs to and then calculates
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // this is a static function, needs to be static in order to use aggregate

  //use an aggregation pipeline, remeber used in tour model for statistics of different averages
  //this refers to the model, pass in array of stages

  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: 'tour', //so we are grouping by something all review docs have which is tour
        //think of aggreate pipline in tourController
        nRating: { $sum: 1 }, //adds one for each tour we have that matched previous step
        avgRating: { $avg: '$rating' }, //rating is the field name where we want to calculate the avetage from
      },
    },
  ]);
  // console.log(stats);

  if (stats.length > 0) {
    //now we want these average stats to be found on the tour for which the ratings are for
    //the fields below need to be populated
    //when searching for the reviews, the avergages appear in an array like this:
    //[ { _id: 'tour', nRating: 6, avgRating: 3 } ]
    //so we populate the corresponding fields in the tour model with these numbers, using the positions of the above array
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating, //so this is the first position of the above array
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    //for when there are no reviews
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};
//want the average calculated evertime new review
reviewSchema.post('save', function () {
  //this is post because it gives time to calculate the average

  //this points to current review
  this.constructor.calcAverageRatings(this.tour); //this points to the current document and the constructor points to the current  model who made the document
  // Review.calcAverageRatings(this.tour);
});

//Okay so what happens when we update or delete? Can't use findByIdAndUpdate because we dont have access in this form
// need access to current review and the id of the tour it is about
// findByIdAndDelete is just findOne using a passed in ID, so below we are looking for these events happening
reviewSchema.pre(/^findOneAnd/, async function (next) {
  //remeber goal is to get access to the current review document
  //with query middleware like findByIdAndUpdate, we only have access to the query, not the docuyment, this method allows us to go around that and actually get access to the document info

  //trying to get tour id
  // const rev = await this.findOne();
  // console.log(rev);
  this.rev = await this.findOne();
  // console.log(this.rev);
  next();
});

//cant use post abpve because it would happen after the query and we woudn't get access to the query with the tour id that we need

//remeber no next for post
//need to pass data from the pre middle ware to the post middle ware
reviewSchema.post(/^findOneAnd/, async function () {
  //passes in the the tour to calcAvgRatings from the review query
  await this.rev.constructor.calcAverageRatings(this.rev.tour);
  //works now with update and delete
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;

//NESTED ROUTES
// POST /tour/tour_id/reviews this is a nested route, want the current user id passed in and the current tour
//so that you dont have to manually type those things in, reviews is clearly child of tours

// GET /tour/tour_id/reviews
// GET /tour/tour_id/reviews/review_id

// this is all with the user ID in the token/ logged in user

//so these nested routes will go in the tour routes
