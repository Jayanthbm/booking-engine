const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const xss = require('xss-clean');
const logger = require('./utils/logger');
const requestContext = require('./middlewares/requestContext.middleware');
const globalErrorHandler = require('./middlewares/errorHandler.middleware');
const routes = require('./routes');

const app = express();

// Security Headers
app.use(helmet());

// Request Context
app.use(requestContext);

// CORS
app.use(cors());

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against XSS
// app.use(xss());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Global Rate Limiting
const limiter = rateLimit({
  max: 100, // 100 requests per windowMs
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

// ...

const basicAuth = require('./middlewares/basicAuth.middleware');
// ...
app.use('/api/v1', routes);
app.use('/api-docs', basicAuth, swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// 404 Handler
// 404 Handler
app.use((req, res, next) => {
  //   next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  res.status(404).json({ status: 'fail', message: `Can't find ${req.originalUrl} on this server!` });
});

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;
