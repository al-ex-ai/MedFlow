import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { Patient } from '../types';

export const patientService = {
  async getAll(): Promise<Patient[]> {
    const response = await axios.get(API_ENDPOINTS.PATIENTS);
    return response.data;
  },

  async getById(id: string): Promise<Patient> {
    const response = await axios.get(`${API_ENDPOINTS.PATIENTS}/${id}`);
    return response.data;
  },

  async create(patient: Omit<Patient, 'id'>): Promise<Patient> {
    const response = await axios.post(API_ENDPOINTS.PATIENTS, patient);
    return response.data;
  },

  async update(id: string, patient: Partial<Patient>): Promise<Patient> {
    const response = await axios.put(`${API_ENDPOINTS.PATIENTS}/${id}`, patient);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await axios.delete(`${API_ENDPOINTS.PATIENTS}/${id}`);
  },
};
