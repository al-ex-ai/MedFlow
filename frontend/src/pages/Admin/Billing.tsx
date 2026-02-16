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
import { billingService } from '../../services/billingService';
import { Invoice, InvoiceStatus } from '../../types';
import { API_CONFIG } from '../../config/api';
import { format } from 'date-fns';

const AdminBilling: React.FC = () => {
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
      const data = await billingService.getAll();
      setInvoices(data);
    } catch (err: any) {
      console.error('Error loading invoices:', err);
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      setError('');
      await billingService.markAsPaid(id);
      loadInvoices();
    } catch (err: any) {
      setError(err.message || 'Failed to mark invoice as paid');
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
      <Typography variant="h4" fontWeight={600} mb={3}>
        Billing
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
              Outstanding
            </Typography>
            <Typography variant="h3" fontWeight={700} color="white">
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
            <Typography variant="h3" fontWeight={700} color="white">
              ${totalPaid.toFixed(2)}
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.8)">
              {paidInvoices.length} paid invoice(s)
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <CardContent>
            <Typography variant="body2" color="white" gutterBottom>
              Total Revenue
            </Typography>
            <Typography variant="h3" fontWeight={700} color="white">
              ${(totalPending + totalPaid).toFixed(2)}
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.8)">
              {invoices.length} total invoice(s)
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
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Invoice ID</strong></TableCell>
                  <TableCell><strong>Patient</strong></TableCell>
                  <TableCell><strong>Description</strong></TableCell>
                  <TableCell><strong>Amount</strong></TableCell>
                  <TableCell><strong>Issued</strong></TableCell>
                  <TableCell><strong>Due</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  {!API_CONFIG.DEMO_MODE && <TableCell><strong>Actions</strong></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {invoice.id.substring(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{invoice.patientName}</Typography>
                      <Typography variant="caption" color="text.secondary">{invoice.patientEmail}</Typography>
                    </TableCell>
                    <TableCell>{invoice.description}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="primary.main">
                        ${invoice.amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.issuedDate), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(invoice.status)}
                        color={getStatusColor(invoice.status)}
                        size="small"
                      />
                    </TableCell>
                    {!API_CONFIG.DEMO_MODE && (
                      <TableCell>
                        {invoice.status === InvoiceStatus.Pending && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<Payment />}
                            onClick={() => handleMarkAsPaid(invoice.id)}
                          >
                            Mark Paid
                          </Button>
                        )}
                        {invoice.status === InvoiceStatus.Paid && invoice.paidDate && (
                          <Typography variant="caption" color="text.secondary">
                            Paid {format(new Date(invoice.paidDate), 'MMM dd, yyyy')}
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

export default AdminBilling;
