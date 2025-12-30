import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { Invoice } from '../types';

export const billingService = {
  async getAll(): Promise<Invoice[]> {
    const response = await axios.get(API_ENDPOINTS.INVOICES);
    return response.data;
  },

  async getById(id: string): Promise<Invoice> {
    const response = await axios.get(`${API_ENDPOINTS.INVOICES}/${id}`);
    return response.data;
  },

  async getByPatientId(patientId: string): Promise<Invoice[]> {
    const response = await axios.get(`${API_ENDPOINTS.INVOICES}/patient/${patientId}`);
    return response.data;
  },

  async markAsPaid(id: string): Promise<Invoice> {
    const response = await axios.post(`${API_ENDPOINTS.INVOICES}/${id}/pay`);
    return response.data;
  },
};
