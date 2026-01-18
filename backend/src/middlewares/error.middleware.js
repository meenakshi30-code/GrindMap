const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message } = err;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }
  
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }

  // Log error for debugging
  console.error(`Error ${statusCode}: ${message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message: process.env.NODE_ENV === 'production' ? 
        (statusCode >= 500 ? 'Internal server error' : message) : message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: { message: `Route ${req.originalUrl} not found` }
  });
};

export { errorHandler, notFound };
