namespace PatientService.API.Events;

public record PatientUpdatedEvent(
    Guid PatientId,
    string FirstName,
    string LastName,
    DateTime UpdatedAt
);
