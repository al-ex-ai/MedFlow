using System.Text.Json.Serialization;

namespace NotificationService.API.Events;

// Event from Appointment Service (Node.js)
public class AppointmentCreatedEventWrapper
{
    [JsonPropertyName("eventType")]
    public string EventType { get; set; } = string.Empty;

    [JsonPropertyName("data")]
    public AppointmentCreatedEventData Data { get; set; } = new();

    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; set; }
}

public class AppointmentCreatedEventData
{
    [JsonPropertyName("appointmentId")]
    public string AppointmentId { get; set; } = string.Empty;

    [JsonPropertyName("patientId")]
    public string PatientId { get; set; } = string.Empty;

    [JsonPropertyName("patientName")]
    public string PatientName { get; set; } = string.Empty;

    [JsonPropertyName("patientEmail")]
    public string PatientEmail { get; set; } = string.Empty;

    [JsonPropertyName("doctorName")]
    public string DoctorName { get; set; } = string.Empty;

    [JsonPropertyName("appointmentDate")]
    public DateTime AppointmentDate { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }
}
