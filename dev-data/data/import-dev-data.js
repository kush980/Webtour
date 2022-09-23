const fs = require('fs');
const mongoose = require('mongoose');
const datenv = require('dotenv');

const Tour = require('../../models/tourModels');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModels');

datenv.config({
  path: './confing.env',
});

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  // .connect(process.env.DATABASE_LOCAL, {
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('DB connection successful');
  });

//READ JSON FILE

//this is importing data from the tours.json. users.json, and reviews.json files in this folder

//node ./dev-data/data/import-dev-data.js to import the data
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);
//IMPORT DATA INTO DB

//node ./dev-data/data/import-dev-data.js --delete to delete the data
//node ./dev-data/data/import-dev-data.js --import to import the data
//this updates and replaces the data when you add slash change
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false }); //there is a validation error so need to pass in additional options object
    await Review.create(reviews);
    console.log('Data sucessfully loaded');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};
// DELETE ALL DATA FROM DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully deleted');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
//Cassandras-MacBook-Air:starter cassandrakornhiser$ node dev-data/data/import-dev-data.js --delete
//Cassandras-MacBook-Air:starter cassandrakornhiser$ node dev-data/data/import-dev-data.js --import
//this is how you update the schema if you add or delete a field or something
// eslint-disable-next-line no-console
console.log(process.argv);
