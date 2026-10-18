import React, { useEffect, useState, useCallback } from 'react';
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
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Add, People, Delete } from '@mui/icons-material';
import { patientService } from '../../services/patientService';
import { Patient } from '../../types';
import { API_CONFIG } from '../../config/api';
import { format } from 'date-fns';
import { errorMessage } from '../../utils/errors';

const AdminPatients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [newPatient, setNewPatient] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    phoneNumber: '',
    address: '',
  });

  const loadPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await patientService.getAll();
      setPatients(data);
    } catch (err) {
      console.error('Error loading patients:', err);
      setError(errorMessage(err, 'Failed to load patients'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Start loading after the effect body so the loader's state updates do not cascade renders.
    void Promise.resolve().then(loadPatients);
  }, [loadPatients]);

  const handleCreatePatient = async () => {
    try {
      setError('');
      await patientService.create(newPatient);
      setOpenDialog(false);
      setNewPatient({ firstName: '', lastName: '', email: '', dateOfBirth: '', phoneNumber: '', address: '' });
      loadPatients();
    } catch (err) {
      setError(errorMessage(err, 'Failed to create patient'));
    }
  };

  const handleDeletePatient = async (id: string) => {
    try {
      setError('');
      await patientService.delete(id);
      loadPatients();
    } catch (err) {
      setError(errorMessage(err, 'Failed to delete patient'));
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
          Patients
        </Typography>
        {!API_CONFIG.DEMO_MODE && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenDialog(true)}>
            Add Patient
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ width: '100%' }}>
        {patients.length === 0 ? (
          <Box textAlign="center" py={8}>
            <People sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No patients registered
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Add the first patient to get started
            </Typography>
            {!API_CONFIG.DEMO_MODE && (
              <Button variant="contained" startIcon={<Add />} onClick={() => setOpenDialog(true)}>
                Add Patient
              </Button>
            )}
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><strong>Date of Birth</strong></TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}><strong>Phone</strong></TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}><strong>Address</strong></TableCell>
                  {!API_CONFIG.DEMO_MODE && <TableCell><strong>Actions</strong></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.light', display: { xs: 'none', sm: 'flex' } }}>
                          {patient.firstName[0]}{patient.lastName[0]}
                        </Avatar>
                        <Typography variant="body2">{patient.firstName} {patient.lastName}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: { xs: 120, sm: 'none' }, overflow: 'hidden', textOverflow: 'ellipsis' }}>{patient.email}</Typography>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      {format(new Date(patient.dateOfBirth), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{patient.phoneNumber}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{patient.address}</TableCell>
                    {!API_CONFIG.DEMO_MODE && (
                      <TableCell>
                        <Tooltip title="Delete patient">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeletePatient(patient.id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Patient</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                label="First Name"
                fullWidth
                value={newPatient.firstName}
                onChange={(e) => setNewPatient({ ...newPatient, firstName: e.target.value })}
              />
              <TextField
                label="Last Name"
                fullWidth
                value={newPatient.lastName}
                onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })}
              />
            </Stack>
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={newPatient.email}
              onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
            />
            <TextField
              label="Date of Birth"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={newPatient.dateOfBirth}
              onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })}
            />
            <TextField
              label="Phone Number"
              fullWidth
              value={newPatient.phoneNumber}
              onChange={(e) => setNewPatient({ ...newPatient, phoneNumber: e.target.value })}
            />
            <TextField
              label="Address"
              fullWidth
              multiline
              rows={2}
              value={newPatient.address}
              onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreatePatient}
            disabled={!newPatient.firstName || !newPatient.lastName || !newPatient.email}
          >
            Add Patient
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPatients;
