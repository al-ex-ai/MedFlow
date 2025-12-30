using MassTransit;
using MongoDB.Driver;
using NotificationService.API.Events;
using NotificationService.API.Data;
using NotificationService.API.Models;

namespace NotificationService.API.Consumers;

public class AppointmentCreatedConsumer : IConsumer<AppointmentCreatedEventWrapper>
{
    private readonly NotificationDbContext _context;
    private readonly ILogger<AppointmentCreatedConsumer> _logger;

    public AppointmentCreatedConsumer(
        NotificationDbContext context,
        ILogger<AppointmentCreatedConsumer> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<AppointmentCreatedEventWrapper> context)
    {
        var eventWrapper = context.Message;
        var appointmentEvent = eventWrapper.Data;

        _logger.LogInformation("Received AppointmentCreated event for appointment: {AppointmentId}",
            appointmentEvent.AppointmentId);

        // Create email notification for appointment confirmation
        var notification = new Notification
        {
            RecipientEmail = appointmentEvent.PatientEmail,
            Type = NotificationType.Email,
            Subject = "Appointment Confirmation",
            Message = $"Dear {appointmentEvent.PatientName},\n\n" +
                     $"Your appointment with {appointmentEvent.DoctorName} has been confirmed.\n\n" +
                     $"Date & Time: {appointmentEvent.AppointmentDate:dddd, MMMM dd, yyyy 'at' h:mm tt}\n" +
                     $"Status: {appointmentEvent.Status}\n\n" +
                     $"Please arrive 15 minutes early.\n\n" +
                     $"Best regards,\nHealthcare Team",
            RelatedEntityId = appointmentEvent.AppointmentId,
            RelatedEntityType = "Appointment",
            Status = NotificationStatus.Pending
        };

        await _context.Notifications.InsertOneAsync(notification);

        // Simulate sending email
        await SimulateSendEmail(notification);

        _logger.LogInformation("Notification created with ID: {NotificationId} for appointment: {AppointmentId}",
            notification.Id, appointmentEvent.AppointmentId);
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
