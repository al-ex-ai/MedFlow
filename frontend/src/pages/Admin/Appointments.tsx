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
      <Typography variant="h4" fontWeight={600} mb={3} sx={{ fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2.125rem' } }}>
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
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Patient</strong></TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><strong>Doctor</strong></TableCell>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}><strong>Duration</strong></TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}><strong>Reason</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  {!API_CONFIG.DEMO_MODE && <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}><strong>Actions</strong></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {appointments.map((apt) => (
                  <TableRow key={apt._id} hover>
                    <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: { xs: 100, sm: 'none' } }}>{apt.patientName}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>{apt.patientEmail}</Typography>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Typography variant="body2" noWrap>Dr. {apt.doctorName}</Typography>
                    </TableCell>
                    <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                      <Typography variant="body2" noWrap>
                        {format(new Date(apt.appointmentDate), 'MMM dd')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(apt.appointmentDate), 'h:mm a')}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{apt.duration} min</TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{apt.reason}</TableCell>
                    <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                      <Chip
                        label={apt.status}
                        color={getStatusColor(apt.status)}
                        size="small"
                      />
                    </TableCell>
                    {!API_CONFIG.DEMO_MODE && (
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
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
