import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
} from '@mui/material';
import { Add, CalendarToday } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { Appointment } from '../../types';
import { API_CONFIG } from '../../config/api';
import { format } from 'date-fns';

const Appointments: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    doctorName: '',
    appointmentDate: '',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      if (!user?.patientId) {
        throw new Error('Patient ID not found');
      }
      const data = await appointmentService.getByPatientId(user.patientId);
      setAppointments(data);
    } catch (err: any) {
      console.error('Error loading appointments:', err);
      setError(err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async () => {
    try {
      if (!user?.patientId || !user?.patientName || !user?.email) {
        throw new Error('User information not found');
      }
      await appointmentService.create({
        patientId: user.patientId,
        patientName: user.patientName,
        patientEmail: user.email,
        doctorName: newAppointment.doctorName,
        appointmentDate: newAppointment.appointmentDate,
        duration: 30,
        status: 'scheduled',
        reason: newAppointment.reason,
        notes: newAppointment.notes,
      });
      setOpenDialog(false);
      setNewAppointment({ doctorName: '', appointmentDate: '', reason: '', notes: '' });
      loadAppointments();
    } catch (err: any) {
      setError(err.message || 'Failed to create appointment');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Typography variant="h4" fontWeight={600} sx={{ fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2.125rem' } }}>
          My Appointments
        </Typography>
        {!API_CONFIG.DEMO_MODE && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
          >
            New Appointment
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ width: '100%' }}>
        {appointments.length === 0 ? (
          <Box textAlign="center" py={8}>
            <CalendarToday sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No appointments found
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Schedule your first appointment to get started
            </Typography>
            {!API_CONFIG.DEMO_MODE && (
              <Button variant="contained" startIcon={<Add />} onClick={() => setOpenDialog(true)}>
                Schedule Appointment
              </Button>
            )}
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Doctor</strong></TableCell>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}><strong>Reason</strong></TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}><strong>Duration</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}><strong>Notes</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appointments.map((apt) => (
                  <TableRow key={apt._id} hover>
                    <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: { xs: 100, sm: 'none' } }}>{apt.doctorName}</Typography>
                    </TableCell>
                    <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                      <Typography variant="body2" noWrap>
                        {format(new Date(apt.appointmentDate), 'MMM dd')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(apt.appointmentDate), 'h:mm a')}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{apt.reason}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{apt.duration} min</TableCell>
                    <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                      <Chip
                        label={apt.status}
                        color={getStatusColor(apt.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{apt.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule New Appointment</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Doctor Name"
              fullWidth
              value={newAppointment.doctorName}
              onChange={(e) => setNewAppointment({ ...newAppointment, doctorName: e.target.value })}
            />
            <TextField
              label="Date & Time"
              type="datetime-local"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={newAppointment.appointmentDate}
              onChange={(e) => setNewAppointment({ ...newAppointment, appointmentDate: e.target.value })}
            />
            <TextField
              label="Reason"
              fullWidth
              value={newAppointment.reason}
              onChange={(e) => setNewAppointment({ ...newAppointment, reason: e.target.value })}
            />
            <TextField
              label="Notes (Optional)"
              fullWidth
              multiline
              rows={3}
              value={newAppointment.notes}
              onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateAppointment}
            disabled={!newAppointment.doctorName || !newAppointment.appointmentDate || !newAppointment.reason}
          >
            Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Appointments;
