import { body, param, validationResult } from 'express-validator';

export const validateAppointment = [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('patientName').notEmpty().withMessage('Patient name is required'),
  body('patientEmail').isEmail().withMessage('Valid email is required'),
  body('doctorName').notEmpty().withMessage('Doctor name is required'),
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('duration').optional().isInt({ min: 15, max: 180 }).withMessage('Duration must be between 15 and 180 minutes'),
  body('reason').notEmpty().withMessage('Reason is required'),
  body('notes').optional().isString(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export const validateId = [
  param('id').isMongoId().withMessage('Invalid appointment ID'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export const validatePatientId = [
  param('patientId').notEmpty().withMessage('Patient ID is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
