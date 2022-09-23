const multer = require('multer');
const sharp = require('sharp');
const catchAsync = require('../routes/utils/catchAsync');
const User = require('../models/userModel');
const AppError = require('../routes/utils/appError');
const factory = require('./handlerFactory');

//saves uploaded images to this folder

// const multerStorage = multer.diskStorage({
//   //feel free to look at multer documentation to better understand
//   destination: (req, file, cb) => {
//     //cb is callback function
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // user-2576245agdahg789-68473634876.jpeg where the 68473634876 is the timestamp and the first part is the user id
//     const ext = file.mimetype.split('/')[1]; // this gets you '.jpeg' frome the minetype of the photoe
//     //the minetype is in the details of the photo found in terminal
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

//BUFFER
const multerStorage = multer.memoryStorage();
//instead of being saved todisk, will nwo be saved as a buffer

//use this to make sure an image is being uplaoded
const multerFilter = (req, file, cb) => {
  //goal of this function is to test if the upload is actually an image

  //check if the minetype starts with image, i.e. minetype: 'image/jpeg'
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

// const upload = multer({ dest: 'public/img/users' });

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

//this below is a middleware funct that happens after a user has updated their profile
//checks if a file is uploaded
//upload now happens to a buffer and not an actual filesystem which is why we use memoryStorage()
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next(); //so if the user did not update the photo, move on to next middleware
  //npm i sharp, look at their website for more documentation and more abilities

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  //doing this as well to define the filename like we did in the original multerStorage
  //buffer doesnt set the filename so thats why

  //because this takes time, need to await for this promise to be finished
  await sharp(req.file.buffer) //actually image procesing, can use previous way if you dont need to resize
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({
      quality: 90, // compress image a bit
    })
    .toFile(`public/img/users/${req.file.filename}`); //now write to file on disk
  //we want a circle, needs to be a square to do that
  //much more effeicent than above with writeing it to the disk and then reading it here
  //basically stores image in memory, so mcuh easier to read
  next();
});

const filterObj = (obj, ...allowedFields) => {
  //takes in req.bodyand the allowed fields as arguments
  //creates empty object, runs through the req.body for the allowed fields which are name and email
  //if an allowed field, adds the field to a new arraty to hold
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  //this is standard JS not node
  return newObj;
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  //SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.body);
  // console.log(req.file);
  //updating the currently authenticated (logged in) user
  // 1) Create error if user POSTs password data (tries to change the password here)
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword',
        400
      )
    );
  }
  // 2) Filter out unwanted field names that are nto allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  //lnks uploaded photo to user, adds photo property to the object for the update
  if (req.file) filteredBody.photo = req.file.filename;

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    //204 is for deleted
    status: 'success',
    data: null,
  });
});

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead.',
  });
};

//{{URL}}/api/v1/users?role=user in getAll url

//have to add middleware for getMe so that getOne is not looking for a url param
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next(); //this adds the current user's id to the url param fir getOne
};
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User); //this is only for admin so can't change passwords, etc
exports.deleteUser = factory.deleteOne(User);
