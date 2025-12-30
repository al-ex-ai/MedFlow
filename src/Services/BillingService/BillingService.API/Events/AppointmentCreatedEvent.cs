namespace BillingService.API.Events;

// Event from Appointment Service
public record AppointmentCreatedEvent(
    Guid AppointmentId,
    Guid PatientId,
    string PatientName,
    string DoctorName,
    DateTime AppointmentDate,
    string Status,
    DateTime CreatedAt
);
