using MassTransit;

namespace NotificationService.API.Events;

// Event from Billing Service (.NET) - MassTransit format
[EntityName("InvoiceCreated")] // Schema-based name, independent of namespace
public record InvoiceCreatedEvent(
    Guid InvoiceId,
    Guid AppointmentId,
    Guid PatientId,
    string PatientEmail,
    decimal Amount,
    DateTime IssuedDate,
    DateTime CreatedAt
);
