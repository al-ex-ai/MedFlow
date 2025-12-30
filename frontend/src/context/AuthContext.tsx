import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { API_ENDPOINTS } from '../config/api';

interface AuthContextType {
  user: User | null;
  login: (email: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string) => {
    // Mock authentication logic
    const isAdmin = email.toLowerCase().includes('admin');

    let userData: User = {
      email,
      role: isAdmin ? 'admin' : 'patient',
    };

    // If patient, fetch patient ID from backend via API Gateway
    if (!isAdmin) {
      try {
        const response = await fetch(API_ENDPOINTS.PATIENTS);
        const patients = await response.json();
        const patient = patients.find((p: any) => p.email.toLowerCase() === email.toLowerCase());

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
