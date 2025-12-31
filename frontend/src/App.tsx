import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/Layout/AppLayout';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import Login from './pages/Login';
import PatientDashboard from './pages/Patient/Dashboard';
import Appointments from './pages/Patient/Appointments';
import Invoices from './pages/Patient/Invoices';
import Notifications from './pages/Patient/Notifications';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Patient Routes */}
            <Route
              path="/patient"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<PatientDashboard />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<div>Admin Dashboard (Coming Soon)</div>} />
              <Route path="patients" element={<div>Patients Page (Coming Soon)</div>} />
              <Route path="appointments" element={<div>Appointments Page (Coming Soon)</div>} />
              <Route path="billing" element={<div>Billing Page (Coming Soon)</div>} />
            </Route>

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
