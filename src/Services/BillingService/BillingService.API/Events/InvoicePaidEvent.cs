namespace BillingService.API.Events;

public record InvoicePaidEvent(
    Guid InvoiceId,
    Guid AppointmentId,
    Guid PatientId,
    decimal Amount,
    DateTime PaidDate
);
