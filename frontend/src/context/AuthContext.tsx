import React, { useState, ReactNode } from 'react';
import { Patient, User } from '../types';
import { API_ENDPOINTS } from '../config/api';
import { AuthContext } from './auth';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Initialize from localStorage synchronously to avoid flash
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  // The session is restored synchronously above, so there is nothing left to wait for.
  const isLoading = false;

  const login = async (email: string) => {
    // Mock authentication logic
    const isAdmin = email.toLowerCase().includes('admin');

    const userData: User = {
      email,
      role: isAdmin ? 'admin' : 'patient',
    };

    // If patient, fetch patient ID from backend via API Gateway
    if (!isAdmin) {
      try {
        const response = await fetch(API_ENDPOINTS.PATIENTS);
        const patients: Patient[] = await response.json();
        const patient = patients.find((p) => p.email.toLowerCase() === email.toLowerCase());

        if (patient) {
          userData.patientId = patient.id;
          userData.patientName = `${patient.firstName} ${patient.lastName}`;
        } else {
          throw new Error('Patient not found with this email');
        }
      } catch (error) {
        console.error('Error fetching patient:', error);
        throw error;
      }
    }

    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
