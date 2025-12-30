namespace NotificationService.API.Events;

// Event from Billing Service (.NET) - MassTransit format
public record InvoiceCreatedEvent(
    Guid InvoiceId,
    Guid AppointmentId,
    Guid PatientId,
    string PatientEmail,
    decimal Amount,
    DateTime IssuedDate,
    DateTime CreatedAt
);
