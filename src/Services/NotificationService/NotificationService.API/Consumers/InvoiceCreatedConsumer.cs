using MassTransit;
using MongoDB.Driver;
using NotificationService.API.Events;
using NotificationService.API.Data;
using NotificationService.API.Models;

namespace NotificationService.API.Consumers;

public class InvoiceCreatedConsumer : IConsumer<InvoiceCreatedEvent>
{
    private readonly NotificationDbContext _context;
    private readonly ILogger<InvoiceCreatedConsumer> _logger;

    public InvoiceCreatedConsumer(
        NotificationDbContext context,
        ILogger<InvoiceCreatedConsumer> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<InvoiceCreatedEvent> context)
    {
        try
        {
            var invoiceEvent = context.Message;

            _logger.LogInformation("Received InvoiceCreated event for invoice: {InvoiceId}, PatientEmail: {PatientEmail}",
                invoiceEvent.InvoiceId, invoiceEvent.PatientEmail);

            // Create email notification for invoice
            var notification = new Notification
            {
                RecipientEmail = invoiceEvent.PatientEmail,
                Type = NotificationType.Email,
                Subject = "New Invoice Available",
                Message = $"Dear Patient,\n\n" +
                         $"A new invoice has been generated for your recent appointment.\n\n" +
                         $"Invoice ID: {invoiceEvent.InvoiceId}\n" +
                         $"Amount: ${invoiceEvent.Amount:F2}\n" +
                         $"Issued Date: {invoiceEvent.IssuedDate:MMMM dd, yyyy}\n\n" +
                         $"Please log in to your patient portal to view and pay your invoice.\n\n" +
                         $"Best regards,\nBilling Department",
                RelatedEntityId = invoiceEvent.InvoiceId.ToString(),
                RelatedEntityType = "Invoice",
                Status = NotificationStatus.Pending
            };

            await _context.Notifications.InsertOneAsync(notification);

            // Simulate sending email
            await SimulateSendEmail(notification);

            _logger.LogInformation("Invoice notification created with ID: {NotificationId} for invoice: {InvoiceId}, sent to: {Email}",
                notification.Id, invoiceEvent.InvoiceId, invoiceEvent.PatientEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing InvoiceCreated event for invoice: {InvoiceId}",
                context.Message.InvoiceId);
            throw;
        }
    }

    private async Task SimulateSendEmail(Notification notification)
    {
        // Simulate email sending delay
        await Task.Delay(100);

        // Update notification status
        notification.Status = NotificationStatus.Sent;
        notification.SentAt = DateTime.UtcNow;

        var filter = MongoDB.Driver.Builders<Notification>.Filter.Eq(n => n.Id, notification.Id);
        var update = MongoDB.Driver.Builders<Notification>.Update
            .Set(n => n.Status, notification.Status)
            .Set(n => n.SentAt, notification.SentAt);

        await _context.Notifications.UpdateOneAsync(filter, update);

        _logger.LogInformation("Email sent to {Email}: {Subject}",
            notification.RecipientEmail, notification.Subject);
    }
}
