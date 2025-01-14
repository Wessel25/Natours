const fs = require('fs');
const dotenv = require('dotenv');
const Review = require('./../../models/reviewModel');
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');

dotenv.config({
  path: './config.env',
});
const mongoose = require('mongoose');
const { argv, exit } = require('process');

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

//Read JSON file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'),
);

//Import Data into MongoDB
const importData = async () => {
  try {
    await User.create(users);
    await Tour.create(tours);
    await Review.create(reviews);
    console.log('Data successfull loaded!');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

//Delete all data from Collection

const deleteData = async () => {
  try {
    await User.deleteMany();
    await Tour.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully deleted!');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

console.log(process.argv);
