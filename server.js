const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log(err);
  console.log('Uncaught Rejection! Shutting down...');
  process.exit(1);
  // server.close(() => {
  //   //Here we gracefully shut down the server
  //    //And then we shut down the application
  // });
});

dotenv.config({ path: './config.env' });
const app = require('./app');
const mongoose = require('mongoose');

//Connecting to Mongoose
const DB_PASSWORD = process.env.DATABASE.replace(
  '<DB_PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
mongoose
  .connect(DB_PASSWORD, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB Connection Successfull!');
  });

//Running Server
const port = 3000 || process.env.port;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

//Global unhandeled rejections
process.on('unhandeledRejection', (err) => {
  console.log(err);
  console.log('Unhandeled Rejection! Shutting down...');
  server.close(() => {
    //Here we gracefully shut down the server
    process.exit(1); //And then we shut down the application
  });
});

// console.log(x);
