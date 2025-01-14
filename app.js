const express = require('express');
const path = require('path');
const morgan = require('morgan');
const tourRouter = require('./Routes/tourRoutes');
const userRouter = require('./Routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorController = require('./controllers/errorController');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const reviewRouter = require('./Routes/reviewRoutes');
const bookingRouter = require('./Routes/bookingRoutes');
const viewRouter = require('./Routes/viewRoutes');

const app = express();

//Initializing pug template
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//Serving static files
app.use(express.static(path.join(__dirname, 'public')));

//GLobal Middelware - Can handle a request before it reaches server, in this case the request that is made to the server, gets parsed into a JavaScript object
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); //This is a HTTP request logger middelware dependancy
}
app.use(express.json());

// Essentially 100 requests per hour per IP-address
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

//More Middelware (creating our own middelware)
app.use((req, res, next) => {
  console.log('Hello from middelware app.js');
  next();
});

app.use(express.urlencoded({ extended: true, limit: '10kb' })); //Here we parse the data coming from the html (in this case the account form).
app.use(cookieParser());
app.use(helmet());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          'https://cdnjs.cloudflare.com',
          'https://js.stripe.com',
        ],
        frameSrc: [
          "'self'",
          'https://js.stripe.com', // Allow Stripe to embed iframes
        ],
        connectSrc: [
          "'self'",
          'https://api.stripe.com', // Allow connections to Stripe's API
        ],
      },
    },
  }),
);

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());

//Data sanitization against XSS attacks
app.use(xss());

//Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingAverage',
      'ratingQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);
//Modified the req and added a requestTime property to the request object.
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//Here we are MOUNTING the middelware function (tourRouter) at a specific path, in this case "/api/v1/tours"
//What this now means is any request that starts with the above mentioned base url will be handeled by the tourRouter such as GET and POST requests.

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

//We can assume that if both the above routers hasn't been executed then the passed in reqUrl isn't defined
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'Failed',
  //   message: `Can't find ${req.originalUrl} on this server`,
  // });
  // const err = new Error(`Can't find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

//Error handling Middelware
app.use(globalErrorController);

module.exports = app;
