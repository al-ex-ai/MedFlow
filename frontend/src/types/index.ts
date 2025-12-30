export interface User {
  email: string;
  role: 'patient' | 'admin';
  patientId?: string;
  patientName?: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
}

export interface Appointment {
  _id?: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  doctorName: string;
  appointmentDate: string;
  duration: number;
  status: string;
  reason: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Invoice {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  amount: number;
  currency: string;
  status: number;
  description: string;
  issuedDate: string;
  dueDate: string;
  paidDate?: string | null;
}

export interface Notification {
  id: string;
  recipientEmail: string;
  recipientPhone: string;
  type: number;
  subject: string;
  message: string;
  status: number;
  relatedEntityId?: string;
  relatedEntityType?: string;
  createdAt: string;
  sentAt?: string | null;
  errorMessage?: string | null;
}

export enum InvoiceStatus {
  Pending = 0,
  Paid = 1,
  Cancelled = 2,
}

export enum NotificationType {
  Email = 0,
  SMS = 1,
  Push = 2,
}

export enum NotificationStatus {
  Pending = 0,
  Sent = 1,
  Failed = 2,
}
