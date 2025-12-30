namespace PatientService.API.Events;

public record PatientCreatedEvent(
    Guid PatientId,
    string FirstName,
    string LastName,
    string Email,
    DateTime CreatedAt
);
