import Joi from 'joi';

export const temporalQuerySchema = Joi.object({
  days: Joi.number().min(1).max(365).default(30),
  resolution: Joi.string().valid('hourly', 'daily', 'weekly').default('daily')
});

export const validateTemporalQuery = (req, res, next) => {
  const { days, resolution } = req.query;
  
  // Validate days
  if (days) {
    const daysNum = parseInt(days, 10);
    if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
      return res.status(400).json({
        error: 'Invalid days parameter: must be a number between 1 and 365'
      });
    }
    req.query.days = daysNum;
  }
  
  // Validate resolution
  if (resolution && !['hourly', 'daily', 'weekly', 'monthly'].includes(resolution)) {
    return res.status(400).json({
      error: 'Invalid resolution parameter: must be hourly, daily, weekly, or monthly'
    });
  }
  
  next();
}; 