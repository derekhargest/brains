/**
 * Global error handling middleware
 */

const errorHandler = (err, req, res, next) => {
  // Log the error
  console.error('Error:', err);
  
  // Check if headers already sent
  if (res.headersSent) {
    return next(err);
  }
  
  // Get status code
  const statusCode = err.statusCode || 500;
  
  // Format error response
  const errorResponse = {
    error: err.message || 'Internal Server Error',
    status: statusCode
  };
  
  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }
  
  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler; 