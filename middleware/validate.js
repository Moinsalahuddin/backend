const { validationResult } = require('express-validator');

// Middleware to handle validation errors
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg || `${err.param}: ${err.msg}`);
    return res.status(400).json({ 
      message: errorMessages.join(', ') || 'Validation failed',
      errors: errors.array() 
    });
  }
  next();
};

