import Appointment from '../models/Appointment.js';
import { cacheGet, cacheSet, cacheDel } from '../config/redis.js';
import { publishEvent } from '../events/eventPublisher.js';
import logger from '../config/logger.js';

// Get all appointments
export const getAllAppointments = async (req, res) => {
  try {
    logger.info('Getting all appointments');

    const appointments = await Appointment.find().sort({ appointmentDate: -1 });

    res.json(appointments);
  } catch (error) {
    logger.error(`Error getting appointments: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve appointments' });
  }
};

// Get appointment by ID
export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Getting appointment with ID: ${id}`);

    // Try cache first
    const cacheKey = `appointment:${id}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Cache the result
    await cacheSet(cacheKey, appointment, 300);

    res.json(appointment);
  } catch (error) {
    logger.error(`Error getting appointment ${req.params.id}: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve appointment' });
  }
};

// Get appointments by patient ID
export const getAppointmentsByPatientId = async (req, res) => {
  try {
    const { patientId } = req.params;
    logger.info(`Getting appointments for patient: ${patientId}`);

    const appointments = await Appointment.find({ patientId }).sort({ appointmentDate: -1 });

    res.json(appointments);
  } catch (error) {
    logger.error(`Error getting appointments for patient ${req.params.patientId}: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve appointments' });
  }
};

// Create appointment
export const createAppointment = async (req, res) => {
  try {
    const appointmentData = req.body;
    logger.info(`Creating new appointment for patient: ${appointmentData.patientEmail}`);

    const appointment = new Appointment(appointmentData);
    await appointment.save();

    logger.info(`Appointment created with ID: ${appointment._id}`);

    // Publish event
    await publishEvent('appointment-events', 'AppointmentCreated', {
      appointmentId: appointment._id.toString(),
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      doctorName: appointment.doctorName,
      appointmentDate: appointment.appointmentDate,
      status: appointment.status,
      createdAt: appointment.createdAt
    });

    // Cache the new appointment
    await cacheSet(`appointment:${appointment._id}`, appointment, 300);

    res.status(201).json(appointment);
  } catch (error) {
    logger.error(`Error creating appointment: ${error.message}`);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};

// Update appointment
export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    logger.info(`Updating appointment: ${id}`);

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    logger.info(`Appointment updated: ${id}`);

    // Publish event
    await publishEvent('appointment-events', 'AppointmentUpdated', {
      appointmentId: appointment._id.toString(),
      patientId: appointment.patientId,
      status: appointment.status,
      updatedAt: appointment.updatedAt
    });

    // Update cache
    await cacheSet(`appointment:${id}`, appointment, 300);

    res.json(appointment);
  } catch (error) {
    logger.error(`Error updating appointment ${req.params.id}: ${error.message}`);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};

// Cancel appointment
export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Cancelling appointment: ${id}`);

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status: 'cancelled', updatedAt: new Date() },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    logger.info(`Appointment cancelled: ${id}`);

    // Publish event
    await publishEvent('appointment-events', 'AppointmentCancelled', {
      appointmentId: appointment._id.toString(),
      patientId: appointment.patientId,
      appointmentDate: appointment.appointmentDate,
      cancelledAt: appointment.updatedAt
    });

    // Update cache
    await cacheSet(`appointment:${id}`, appointment, 300);

    res.json(appointment);
  } catch (error) {
    logger.error(`Error cancelling appointment ${req.params.id}: ${error.message}`);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
};

// Delete appointment
export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Deleting appointment: ${id}`);

    const appointment = await Appointment.findByIdAndDelete(id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    logger.info(`Appointment deleted: ${id}`);

    // Publish event
    await publishEvent('appointment-events', 'AppointmentDeleted', {
      appointmentId: id,
      patientId: appointment.patientId,
      deletedAt: new Date()
    });

    // Remove from cache
    await cacheDel(`appointment:${id}`);

    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting appointment ${req.params.id}: ${error.message}`);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
};
