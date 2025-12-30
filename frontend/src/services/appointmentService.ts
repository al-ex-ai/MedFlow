import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { Appointment } from '../types';

export const appointmentService = {
  async getAll(): Promise<Appointment[]> {
    const response = await axios.get(API_ENDPOINTS.APPOINTMENTS);
    return response.data;
  },

  async getById(id: string): Promise<Appointment> {
    const response = await axios.get(`${API_ENDPOINTS.APPOINTMENTS}/${id}`);
    return response.data;
  },

  async getByPatientId(patientId: string): Promise<Appointment[]> {
    const response = await axios.get(`${API_ENDPOINTS.APPOINTMENTS}/patient/${patientId}`);
    return response.data;
  },

  async create(appointment: Omit<Appointment, '_id' | 'createdAt' | 'updatedAt'>): Promise<Appointment> {
    const response = await axios.post(API_ENDPOINTS.APPOINTMENTS, appointment);
    return response.data;
  },

  async update(id: string, appointment: Partial<Appointment>): Promise<Appointment> {
    const response = await axios.put(`${API_ENDPOINTS.APPOINTMENTS}/${id}`, appointment);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await axios.delete(`${API_ENDPOINTS.APPOINTMENTS}/${id}`);
  },
};
