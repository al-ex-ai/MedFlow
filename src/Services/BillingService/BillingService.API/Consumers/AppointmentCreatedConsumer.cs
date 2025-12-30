using MassTransit;
using BillingService.API.Events;
using BillingService.API.Data;
using BillingService.API.Models;

namespace BillingService.API.Consumers;

public class AppointmentCreatedConsumer : IConsumer<AppointmentCreatedEvent>
{
    private readonly BillingDbContext _context;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<AppointmentCreatedConsumer> _logger;

    public AppointmentCreatedConsumer(
        BillingDbContext context,
        IPublishEndpoint publishEndpoint,
        ILogger<AppointmentCreatedConsumer> logger)
    {
        _context = context;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<AppointmentCreatedEvent> context)
    {
        var appointmentEvent = context.Message;
        _logger.LogInformation("Received AppointmentCreated event for appointment: {AppointmentId}", appointmentEvent.AppointmentId);

        // Auto-generate invoice for the appointment
        var invoice = new Invoice
        {
            Id = Guid.NewGuid(),
            AppointmentId = appointmentEvent.AppointmentId,
            PatientId = appointmentEvent.PatientId,
            PatientName = appointmentEvent.PatientName,
            PatientEmail = "", // Will be set from patient data in real scenario
            Amount = 150.00m, // Fixed appointment fee for demo
            Currency = "USD",
            Status = InvoiceStatus.Pending,
            Description = $"Medical consultation with {appointmentEvent.DoctorName} on {appointmentEvent.AppointmentDate:yyyy-MM-dd}",
            IssuedDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow
        };

        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Invoice created with ID: {InvoiceId} for appointment: {AppointmentId}",
            invoice.Id, appointmentEvent.AppointmentId);

        // Publish InvoiceCreated event
        var invoiceCreatedEvent = new InvoiceCreatedEvent(
            invoice.Id,
            invoice.AppointmentId,
            invoice.PatientId,
            invoice.PatientEmail,
            invoice.Amount,
            invoice.IssuedDate,
            invoice.CreatedAt
        );

        await _publishEndpoint.Publish(invoiceCreatedEvent);
        _logger.LogInformation("Published InvoiceCreatedEvent for invoice: {InvoiceId}", invoice.Id);
    }
}
