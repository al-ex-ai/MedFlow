// Healthcare Microservices - MongoDB Initialization
// This script creates collections and indexes

// Create AppointmentDb
db = db.getSiblingDB('AppointmentDb');
db.createCollection('appointments');
db.appointments.createIndex({ "patientId": 1 });
db.appointments.createIndex({ "appointmentDate": 1 });
db.appointments.createIndex({ "status": 1 });
print('AppointmentDb initialized with indexes');

// Create NotificationDb
db = db.getSiblingDB('NotificationDb');
db.createCollection('notifications');
db.notifications.createIndex({ "patientId": 1 });
db.notifications.createIndex({ "createdAt": -1 });
db.notifications.createIndex({ "type": 1 });
print('NotificationDb initialized with indexes');

print('MongoDB initialization complete');
