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
  Stack,
  Avatar,
} from '@mui/material';
import { Event, Cancel } from '@mui/icons-material';
import { appointmentService } from '../../services/appointmentService';
import { Appointment } from '../../types';
import { API_CONFIG } from '../../config/api';
import { format } from 'date-fns';

const AdminAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await appointmentService.getAll();
      setAppointments(data);
    } catch (err: any) {
      console.error('Error loading appointments:', err);
      setError(err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (id: string) => {
    try {
      setError('');
      await appointmentService.cancel(id);
      loadAppointments();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel appointment');
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
      <Typography variant="h4" fontWeight={600} mb={3}>
        Appointments
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ width: '100%' }}>
        {appointments.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Event sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No appointments found
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Patient</strong></TableCell>
                  <TableCell><strong>Doctor</strong></TableCell>
                  <TableCell><strong>Date & Time</strong></TableCell>
                  <TableCell><strong>Duration</strong></TableCell>
                  <TableCell><strong>Reason</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  {!API_CONFIG.DEMO_MODE && <TableCell><strong>Actions</strong></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {appointments.map((apt) => (
                  <TableRow key={apt._id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width: 36, height: 36, bgcolor: 'secondary.light' }}>
                          {apt.patientName.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">{apt.patientName}</Typography>
                          <Typography variant="caption" color="text.secondary">{apt.patientEmail}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.light' }}>
                          {apt.doctorName.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <Typography variant="body2">Dr. {apt.doctorName}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(apt.appointmentDate), 'MMM dd, yyyy')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(apt.appointmentDate), 'h:mm a')}
                      </Typography>
                    </TableCell>
                    <TableCell>{apt.duration} min</TableCell>
                    <TableCell>{apt.reason}</TableCell>
                    <TableCell>
                      <Chip
                        label={apt.status}
                        color={getStatusColor(apt.status)}
                        size="small"
                      />
                    </TableCell>
                    {!API_CONFIG.DEMO_MODE && (
                      <TableCell>
                        {apt.status.toLowerCase() === 'scheduled' && (
                          <Button
                            size="small"
                            color="error"
                            startIcon={<Cancel />}
                            onClick={() => handleCancelAppointment(apt._id!)}
                          >
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default AdminAppointments;
