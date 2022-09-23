const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message, err.stack);
  console.log();
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB =
  'mongodb+srv://cass:447X2aKAOgbGFPSC@cluster0.5yph4.mongodb.net/natours?retryWrites=true';

mongoose
  .connect(DB, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connection successful!'));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message, err.stack);
  console.log(DB, process.env.DATABASE_PASSWORD, process.env.DATABASE);
  server.close(() => {
    process.exit(1);
  });
});

//added for Heroku, which resets every 24hrs, so this will prevent any abrupt shutdown without finishing promises
//Polite way to ask app to shut down
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});

//heroku ps:restart
