namespace BillingService.API.Events;

public record InvoiceCreatedEvent(
    Guid InvoiceId,
    Guid AppointmentId,
    Guid PatientId,
    string PatientEmail,
    decimal Amount,
    DateTime IssuedDate,
    DateTime CreatedAt
);
