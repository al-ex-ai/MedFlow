import express from 'express';
import {
  getAllAppointments,
  getAppointmentById,
  getAppointmentsByPatientId,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  deleteAppointment
} from '../controllers/appointmentController.js';
import { validateAppointment, validateId, validatePatientId } from '../middleware/validator.js';

const router = express.Router();

// Get all appointments
router.get('/', getAllAppointments);

// Get appointment by ID
router.get('/:id', validateId, getAppointmentById);

// Get appointments by patient ID
router.get('/patient/:patientId', validatePatientId, getAppointmentsByPatientId);

// Create new appointment
router.post('/', validateAppointment, createAppointment);

// Update appointment
router.put('/:id', validateId, updateAppointment);

// Cancel appointment
router.patch('/:id/cancel', validateId, cancelAppointment);

// Delete appointment
router.delete('/:id', validateId, deleteAppointment);

export default router;
