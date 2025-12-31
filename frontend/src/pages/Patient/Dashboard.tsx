import React, { useEffect, useState, useMemo } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Divider,
  Avatar,
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
  Badge,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  CalendarToday,
  Receipt,
  Notifications as NotificationsIcon,
  TrendingUp,
  ArrowForward,
  AccessTime,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import dayjs, { Dayjs } from 'dayjs';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { billingService } from '../../services/billingService';
import { notificationService } from '../../services/notificationService';
import { Appointment, Invoice, Notification, InvoiceStatus } from '../../types';
import { format } from 'date-fns';

// Custom day component to highlight days with appointments
function AppointmentDay(
  props: PickersDayProps & { appointmentDates?: string[] }
) {
  const { appointmentDates = [], day, outsideCurrentMonth, ...other } = props;
  const dateStr = (day as Dayjs).format('YYYY-MM-DD');
  const hasAppointment = appointmentDates.includes(dateStr);

  return (
    <Badge
      key={(day as Dayjs).toString()}
      overlap="circular"
      badgeContent={hasAppointment ? '•' : undefined}
      sx={{
        '& .MuiBadge-badge': {
          fontSize: '1.2rem',
          color: 'primary.main',
          top: 4,
          right: 4,
        },
      }}
    >
      <PickersDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />
    </Badge>
  );
}

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      if (!user?.patientId) {
        throw new Error('Patient ID not found');
      }

      const [appointmentsData, invoicesData, notificationsData] = await Promise.all([
        appointmentService.getByPatientId(user.patientId),
        billingService.getByPatientId(user.patientId),
        notificationService.getByEmail(user.email),
      ]);

      setAppointments(appointmentsData.slice(0, 5));
      setInvoices(invoicesData.slice(0, 5));
      setNotifications(notificationsData.slice(0, 5));
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
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

  const getInvoiceStatusLabel = (status: number) => {
    switch (status) {
      case InvoiceStatus.Pending: return 'Pending';
      case InvoiceStatus.Paid: return 'Paid';
      case InvoiceStatus.Cancelled: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getInvoiceStatusColor = (status: number) => {
    switch (status) {
      case InvoiceStatus.Pending: return 'warning';
      case InvoiceStatus.Paid: return 'success';
      case InvoiceStatus.Cancelled: return 'error';
      default: return 'default';
    }
  };

  const upcomingAppointments = appointments.filter(apt =>
    apt.status.toLowerCase() === 'scheduled' && new Date(apt.appointmentDate) > new Date()
  );

  const pendingInvoices = invoices.filter(inv => inv.status === InvoiceStatus.Pending);
  const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  // Get all appointment dates for calendar highlighting
  const appointmentDates = useMemo(() => {
    return appointments.map(apt => dayjs(apt.appointmentDate).format('YYYY-MM-DD'));
  }, [appointments]);

  // Get appointments for selected date
  const selectedDateAppointments = useMemo(() => {
    if (!selectedDate) return [];
    const selectedStr = selectedDate.format('YYYY-MM-DD');
    return appointments.filter(apt =>
      dayjs(apt.appointmentDate).format('YYYY-MM-DD') === selectedStr
    );
  }, [appointments, selectedDate]);

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
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '2rem' }}>
            {user?.patientName?.split(' ').map(n => n[0]).join('') || 'P'}
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={600}>
              Welcome back, {user?.patientName?.split(' ')[0] || user?.email}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Here's your health overview
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <CalendarToday sx={{ color: 'white', fontSize: 32 }} />
                  <Chip
                    label={upcomingAppointments.length > 0 ? 'Upcoming' : 'None'}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Box>
                <Box>
                  <Typography variant="h3" fontWeight={700} color="white">
                    {appointments.length}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.9)">
                    Total Appointments
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
                  <Receipt sx={{ color: 'white', fontSize: 32 }} />
                  <Chip
                    label={`${pendingInvoices.length} Pending`}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Box>
                <Box>
                  <Typography variant="h3" fontWeight={700} color="white">
                    ${totalPending.toFixed(0)}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.9)">
                    Outstanding Balance
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
                  <NotificationsIcon sx={{ color: 'white', fontSize: 32 }} />
                  <Chip
                    label={notifications.length > 0 ? 'New' : 'None'}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Box>
                <Box>
                  <Typography variant="h3" fontWeight={700} color="white">
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

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <CardContent>
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <TrendingUp sx={{ color: 'white', fontSize: 32 }} />
                  <Chip
                    label="Active"
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Box>
                <Box>
                  <Typography variant="h3" fontWeight={700} color="white">
                    100%
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.9)">
                    Health Score
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Calendar Section */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Appointment Calendar
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateCalendar
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
                slots={{
                  day: AppointmentDay,
                }}
                slotProps={{
                  day: {
                    appointmentDates,
                  } as any,
                }}
                sx={{ width: '100%' }}
              />
            </LocalizationProvider>

            {/* Selected Date Appointments */}
            {selectedDate && (
              <Box mt={2}>
                <Typography variant="subtitle2" color="text.secondary" mb={1}>
                  {selectedDate.format('MMMM D, YYYY')}
                </Typography>
                {selectedDateAppointments.length === 0 ? (
                  <Typography variant="body2" color="text.disabled">
                    No appointments on this day
                  </Typography>
                ) : (
                  <List dense disablePadding>
                    {selectedDateAppointments.map((apt) => (
                      <ListItem
                        key={apt._id}
                        sx={{
                          bgcolor: 'action.hover',
                          borderRadius: 1,
                          mb: 1,
                          px: 1.5,
                        }}
                      >
                        <AccessTime sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                        <ListItemText
                          primary={`Dr. ${apt.doctorName}`}
                          secondary={`${format(new Date(apt.appointmentDate), 'h:mm a')} - ${apt.reason}`}
                          primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                        <Chip
                          label={apt.status}
                          color={getStatusColor(apt.status)}
                          size="small"
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Upcoming Appointments Table */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight={600}>
                Upcoming Appointments
              </Typography>
              <Button endIcon={<ArrowForward />} size="small">
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {appointments.length === 0 ? (
              <Box textAlign="center" py={4}>
                <CalendarToday sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No appointments scheduled
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Doctor</strong></TableCell>
                      <TableCell><strong>Date & Time</strong></TableCell>
                      <TableCell><strong>Reason</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {appointments.map((apt) => (
                      <TableRow key={apt._id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
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
                        <TableCell>{apt.reason}</TableCell>
                        <TableCell>
                          <Chip
                            label={apt.status}
                            color={getStatusColor(apt.status)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Recent Invoices */}
        <Grid size={{ xs: 12 }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight={600}>
                Recent Invoices
              </Typography>
              <Button endIcon={<ArrowForward />} size="small">
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {invoices.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Receipt sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No invoices found
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {invoices.map((invoice) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={invoice.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                          <Typography variant="h6" color="primary.main" fontWeight={600}>
                            ${invoice.amount.toFixed(2)}
                          </Typography>
                          <Chip
                            label={getInvoiceStatusLabel(invoice.status)}
                            color={getInvoiceStatusColor(invoice.status)}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {invoice.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Due: {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PatientDashboard;
