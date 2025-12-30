import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    index: true
  },
  patientName: {
    type: String,
    required: true
  },
  patientEmail: {
    type: String,
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  appointmentDate: {
    type: Date,
    required: true,
    index: true
  },
  duration: {
    type: Number,
    required: true,
    default: 30 // minutes
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'cancelled', 'completed', 'no-show'],
    default: 'scheduled',
    index: true
  },
  reason: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
appointmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Compound index for querying appointments by patient and date
appointmentSchema.index({ patientId: 1, appointmentDate: 1 });

// Index for querying appointments by status and date
appointmentSchema.index({ status: 1, appointmentDate: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
