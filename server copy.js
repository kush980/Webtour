const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message, err.stack);
  process.exit(1);
});
//WANT THIS UNCAUGHT EXCEPTION AT THE TOP TO LISTEN THRU TO CHECK
const app = require('./app');

dotenv.config({
  path: './confing.env',
});

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// .connect(process.env.DATABASE_LOCAL, {
mongoose
  .connect(DB, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('DB connection successful');
  });

//console.log(app.get('env'));
//global vars that say what environment we are in

//prints development

//process.env.PORT is mandatory for heroku, it assigns a random port as a env. variable
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message, err.stack);
  //gracefully closes down the server
  server.close(() => {
    process.exit(1);
  });
});
//THIS IS A NON OPERATINAL ERROR SO YOU'LL GET A 500  ERROR CODE ON POSTMAN (client)
//console.log(x);
//this is an example of an uncaught exception
