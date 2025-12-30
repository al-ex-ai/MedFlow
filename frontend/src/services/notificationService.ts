import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { Notification, NotificationStatus } from '../types';

export const notificationService = {
  async getAll(): Promise<Notification[]> {
    const response = await axios.get(API_ENDPOINTS.NOTIFICATIONS);
    return response.data;
  },

  async getById(id: string): Promise<Notification> {
    const response = await axios.get(`${API_ENDPOINTS.NOTIFICATIONS}/${id}`);
    return response.data;
  },

  async getByEmail(email: string): Promise<Notification[]> {
    const response = await axios.get(`${API_ENDPOINTS.NOTIFICATIONS}/by-email/${encodeURIComponent(email)}`);
    return response.data;
  },

  async getByStatus(status: NotificationStatus): Promise<Notification[]> {
    const response = await axios.get(`${API_ENDPOINTS.NOTIFICATIONS}/by-status/${status}`);
    return response.data;
  },
};
