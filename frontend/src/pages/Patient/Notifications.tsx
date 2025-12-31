import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Stack,
  Divider,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Email,
  Sms,
  NotificationsActive,
  CheckCircle,
  Error as ErrorIcon,
  Schedule,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';
import { Notification, NotificationType, NotificationStatus } from '../../types';
import { format, formatDistanceToNow } from 'date-fns';

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      if (!user?.email) {
        throw new Error('User email not found');
      }
      const data = await notificationService.getByEmail(user.email);
      setNotifications(data);
    } catch (err: any) {
      console.error('Error loading notifications:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: number) => {
    switch (type) {
      case NotificationType.Email: return <Email color="primary" />;
      case NotificationType.SMS: return <Sms color="secondary" />;
      case NotificationType.Push: return <NotificationsActive color="info" />;
      default: return <NotificationsIcon />;
    }
  };

  const getTypeLabel = (type: number) => {
    switch (type) {
      case NotificationType.Email: return 'Email';
      case NotificationType.SMS: return 'SMS';
      case NotificationType.Push: return 'Push';
      default: return 'Unknown';
    }
  };

  const getStatusIcon = (status: number) => {
    switch (status) {
      case NotificationStatus.Sent: return <CheckCircle color="success" fontSize="small" />;
      case NotificationStatus.Failed: return <ErrorIcon color="error" fontSize="small" />;
      case NotificationStatus.Pending: return <Schedule color="warning" fontSize="small" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case NotificationStatus.Pending: return 'Pending';
      case NotificationStatus.Sent: return 'Sent';
      case NotificationStatus.Failed: return 'Failed';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case NotificationStatus.Pending: return 'warning';
      case NotificationStatus.Sent: return 'success';
      case NotificationStatus.Failed: return 'error';
      default: return 'default';
    }
  };

  const sentCount = notifications.filter(n => n.status === NotificationStatus.Sent).length;
  const pendingCount = notifications.filter(n => n.status === NotificationStatus.Pending).length;

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
        My Notifications
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} mb={4}>
        <Card sx={{ flex: 1, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
          <CardContent>
            <Typography variant="body2" color="white" gutterBottom>
              Total Notifications
            </Typography>
            <Typography variant="h3" fontWeight={700} color="white">
              {notifications.length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
          <CardContent>
            <Typography variant="body2" color="white" gutterBottom>
              Sent
            </Typography>
            <Typography variant="h3" fontWeight={700} color="white">
              {sentCount}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
          <CardContent>
            <Typography variant="body2" color="white" gutterBottom>
              Pending
            </Typography>
            <Typography variant="h3" fontWeight={700} color="white">
              {pendingCount}
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      <Paper elevation={2} sx={{ width: '100%' }}>
        {notifications.length === 0 ? (
          <Box textAlign="center" py={8}>
            <NotificationsIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No notifications yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You'll receive notifications for appointments and invoices
            </Typography>
          </Box>
        ) : (
          <List>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                {index > 0 && <Divider />}
                <ListItem
                  sx={{
                    py: 2,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <ListItemIcon>
                    {getTypeIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle1" fontWeight={500}>
                          {notification.subject}
                        </Typography>
                        <Chip
                          label={getTypeLabel(notification.type)}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          icon={getStatusIcon(notification.status)}
                          label={getStatusLabel(notification.status)}
                          size="small"
                          color={getStatusColor(notification.status)}
                        />
                      </Stack>
                    }
                    secondary={
                      <Box mt={1}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          {notification.sentAt && (
                            <> • Sent on {format(new Date(notification.sentAt), 'MMM dd, yyyy h:mm a')}</>
                          )}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default Notifications;
