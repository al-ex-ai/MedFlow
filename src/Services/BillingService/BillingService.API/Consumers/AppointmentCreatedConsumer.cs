using MassTransit;
using BillingService.API.Events;
using BillingService.API.Data;
using BillingService.API.Models;

namespace BillingService.API.Consumers;

public class AppointmentCreatedConsumer : IConsumer<AppointmentCreatedEventWrapper>
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

    public async Task Consume(ConsumeContext<AppointmentCreatedEventWrapper> context)
    {
        var eventWrapper = context.Message;
        var appointmentEvent = eventWrapper.Data;

        _logger.LogInformation("Received AppointmentCreated event for appointment: {AppointmentId}", appointmentEvent.AppointmentId);

        // Parse PatientId - try as Guid first (from Patient Service), otherwise generate new Guid
        // AppointmentId is MongoDB ObjectId string - we'll store it as string reference
        Guid patientId;
        if (!Guid.TryParse(appointmentEvent.PatientId, out patientId))
        {
            // If PatientId is not a valid Guid (e.g., MongoDB ObjectId), generate a new one
            patientId = Guid.NewGuid();
            _logger.LogWarning("PatientId {PatientId} is not a valid Guid, generated new PatientId: {NewPatientId}",
                appointmentEvent.PatientId, patientId);
        }

        // Log received event data
        _logger.LogInformation("Creating invoice - PatientName: {PatientName}, PatientEmail: {PatientEmail}",
            appointmentEvent.PatientName, appointmentEvent.PatientEmail);

        // Auto-generate invoice for the appointment
        var invoice = new Invoice
        {
            Id = Guid.NewGuid(),
            AppointmentId = Guid.NewGuid(), // Generate new Guid for our system
            PatientId = patientId,
            PatientName = appointmentEvent.PatientName,
            PatientEmail = appointmentEvent.PatientEmail,
            Amount = 150.00m, // Fixed appointment fee for demo
            Currency = "USD",
            Status = InvoiceStatus.Pending,
            Description = $"Medical consultation with {appointmentEvent.DoctorName} on {appointmentEvent.AppointmentDate:yyyy-MM-dd} (Appt: {appointmentEvent.AppointmentId})",
            IssuedDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow
        };

        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Invoice created with ID: {InvoiceId}, PatientEmail saved: {PatientEmail}, for appointment: {AppointmentId} (MongoDB: {MongoAppointmentId})",
            invoice.Id, invoice.PatientEmail, invoice.AppointmentId, appointmentEvent.AppointmentId);

        // Publish InvoiceCreated event to "invoice-events" exchange (schema-based, service-independent)
        var invoiceCreatedEvent = new InvoiceCreatedEvent(
            invoice.Id,
            invoice.AppointmentId,
            invoice.PatientId,
            invoice.PatientEmail,
            invoice.Amount,
            invoice.IssuedDate,
            invoice.CreatedAt
        );

        // Publish - will use "invoice-events" exchange as configured in message topology
        await _publishEndpoint.Publish(invoiceCreatedEvent);
        _logger.LogInformation("Published InvoiceCreatedEvent to 'invoice-events' exchange for invoice: {InvoiceId}", invoice.Id);
    }
}
