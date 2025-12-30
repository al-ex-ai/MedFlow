namespace BillingService.API.Models;

public record InvoiceDto(
    Guid Id,
    Guid AppointmentId,
    Guid PatientId,
    string PatientName,
    string PatientEmail,
    decimal Amount,
    string Currency,
    InvoiceStatus Status,
    string Description,
    DateTime IssuedDate,
    DateTime? DueDate,
    DateTime? PaidDate
);

public record CreateInvoiceDto(
    Guid AppointmentId,
    Guid PatientId,
    string PatientName,
    string PatientEmail,
    decimal Amount,
    string Description
);

public record PayInvoiceDto(
    Guid InvoiceId
);
