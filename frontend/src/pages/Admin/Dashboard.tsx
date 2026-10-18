import React, { useEffect, useState, useCallback } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Button,
  Divider,
} from '@mui/material';
import {
  People,
  Event,
  Receipt,
  Notifications as NotificationsIcon,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { patientService } from '../../services/patientService';
import { appointmentService } from '../../services/appointmentService';
import { billingService } from '../../services/billingService';
import { notificationService } from '../../services/notificationService';
import { Patient, Appointment, Invoice, Notification, InvoiceStatus } from '../../types';
import { format } from 'date-fns';
import { errorMessage } from '../../utils/errors';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [patientsData, appointmentsData, invoicesData, notificationsData] = await Promise.all([
        patientService.getAll(),
        appointmentService.getAll(),
        billingService.getAll(),
        notificationService.getAll(),
      ]);
      setPatients(patientsData);
      setAppointments(appointmentsData);
      setInvoices(invoicesData);
      setNotifications(notificationsData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(errorMessage(err, 'Failed to load dashboard data'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Start loading after the effect body so the loader's state updates do not cascade renders.
    void Promise.resolve().then(loadDashboardData);
  }, [loadDashboardData]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const totalRevenue = invoices
    .filter(inv => inv.status === InvoiceStatus.Paid)
    .reduce((sum, inv) => sum + inv.amount, 0);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" fontWeight={600} mb={4} sx={{ fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2.125rem' } }}>
        Admin Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <People sx={{ color: 'white', fontSize: 32 }} />
                  <Chip label="Total" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="h3" fontWeight={700} color="white" sx={{ fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' } }}>
                    {patients.length}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.9)">
                    Patients
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent>
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Event sx={{ color: 'white', fontSize: 32 }} />
                  <Chip label="Total" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="h3" fontWeight={700} color="white" sx={{ fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' } }}>
                    {appointments.length}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.9)">
                    Appointments
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CardContent>
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Receipt sx={{ color: 'white', fontSize: 32 }} />
                  <Chip label={`$${totalRevenue.toFixed(0)}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="h3" fontWeight={700} color="white" sx={{ fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' } }}>
                    {invoices.length}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.9)">
                    Invoices
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <CardContent>
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <NotificationsIcon sx={{ color: 'white', fontSize: 32 }} />
                  <Chip label="Total" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="h3" fontWeight={700} color="white" sx={{ fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' } }}>
                    {notifications.length}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.9)">
                    Notifications
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tables */}
      <Grid container spacing={3}>
        {/* Recent Patients */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={600}>
                Recent Patients
              </Typography>
              <Button endIcon={<ArrowForward />} size="small" onClick={() => navigate('/admin/patients')}>
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {patients.length === 0 ? (
              <Box textAlign="center" py={4}>
                <People sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">No patients registered</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Name</strong></TableCell>
                      <TableCell><strong>Email</strong></TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><strong>Phone</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {patients.slice(0, 5).map((patient) => (
                      <TableRow key={patient.id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.light', fontSize: '0.75rem', display: { xs: 'none', sm: 'flex' } }}>
                              {patient.firstName[0]}{patient.lastName[0]}
                            </Avatar>
                            <Typography variant="body2">{patient.firstName} {patient.lastName}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: { xs: 120, sm: 'none' }, overflow: 'hidden', textOverflow: 'ellipsis' }}>{patient.email}</Typography>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          <Typography variant="body2">{patient.phoneNumber}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Recent Appointments */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={600}>
                Recent Appointments
              </Typography>
              <Button endIcon={<ArrowForward />} size="small" onClick={() => navigate('/admin/appointments')}>
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {appointments.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Event sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">No appointments found</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Patient</strong></TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><strong>Doctor</strong></TableCell>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}><strong>Status</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {appointments.slice(0, 5).map((apt) => (
                      <TableRow key={apt._id} hover>
                        <TableCell>
                          <Typography variant="body2">{apt.patientName}</Typography>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.light', fontSize: '0.75rem' }}>
                              {apt.doctorName.split(' ').map(n => n[0]).join('')}
                            </Avatar>
                            <Typography variant="body2">{apt.doctorName}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {format(new Date(apt.appointmentDate), 'MMM dd')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(apt.appointmentDate), 'h:mm a')}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                          <Chip label={apt.status} color={getStatusColor(apt.status)} size="small" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
