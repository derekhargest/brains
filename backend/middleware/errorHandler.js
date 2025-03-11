export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong' 
    : err.message;
  
  // Log to monitoring system
  console.error(`[${new Date().toISOString()}] ERROR ${status}:`, {
    message: err.message,
    stack: err.stack,
    route: req.originalUrl
  });

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
} 