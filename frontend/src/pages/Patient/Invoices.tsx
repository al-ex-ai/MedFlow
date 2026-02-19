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
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import { Receipt, Payment } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { billingService } from '../../services/billingService';
import { Invoice, InvoiceStatus } from '../../types';
import { API_CONFIG } from '../../config/api';
import { format } from 'date-fns';

const Invoices: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      if (!user?.patientId) {
        throw new Error('Patient ID not found');
      }
      const data = await billingService.getByPatientId(user.patientId);
      setInvoices(data);
    } catch (err: any) {
      console.error('Error loading invoices:', err);
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handlePayInvoice = async (id: string) => {
    try {
      await billingService.markAsPaid(id);
      loadInvoices();
    } catch (err: any) {
      setError(err.message || 'Failed to process payment');
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case InvoiceStatus.Pending: return 'Pending';
      case InvoiceStatus.Paid: return 'Paid';
      case InvoiceStatus.Cancelled: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case InvoiceStatus.Pending: return 'warning';
      case InvoiceStatus.Paid: return 'success';
      case InvoiceStatus.Cancelled: return 'error';
      default: return 'default';
    }
  };

  const pendingInvoices = invoices.filter(inv => inv.status === InvoiceStatus.Pending);
  const paidInvoices = invoices.filter(inv => inv.status === InvoiceStatus.Paid);
  const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);

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
        My Invoices
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} mb={4}>
        <Card sx={{ flex: 1, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
          <CardContent>
            <Typography variant="body2" color="white" gutterBottom>
              Outstanding Balance
            </Typography>
            <Typography variant="h3" fontWeight={700} color="white" sx={{ fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' } }}>
              ${totalPending.toFixed(2)}
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.8)">
              {pendingInvoices.length} pending invoice(s)
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
          <CardContent>
            <Typography variant="body2" color="white" gutterBottom>
              Total Paid
            </Typography>
            <Typography variant="h3" fontWeight={700} color="white" sx={{ fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' } }}>
              ${totalPaid.toFixed(2)}
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.8)">
              {paidInvoices.length} paid invoice(s)
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      <Paper elevation={2} sx={{ width: '100%' }}>
        {invoices.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Receipt sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No invoices found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your invoices will appear here after appointments
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><strong>Description</strong></TableCell>
                  <TableCell><strong>Amount</strong></TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}><strong>Due</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  {!API_CONFIG.DEMO_MODE && <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}><strong>Actions</strong></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} hover>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{invoice.description}</TableCell>
                    <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                      <Typography variant="body2" fontWeight={600} color="primary.main" noWrap>
                        ${invoice.amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                      {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                      <Chip
                        label={getStatusLabel(invoice.status)}
                        color={getStatusColor(invoice.status)}
                        size="small"
                      />
                    </TableCell>
                    {!API_CONFIG.DEMO_MODE && (
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        {invoice.status === InvoiceStatus.Pending && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<Payment />}
                            onClick={() => handlePayInvoice(invoice.id)}
                          >
                            Pay
                          </Button>
                        )}
                        {invoice.status === InvoiceStatus.Paid && invoice.paidDate && (
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(invoice.paidDate), 'MMM dd')}
                          </Typography>
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

export default Invoices;
