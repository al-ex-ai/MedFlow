namespace PatientService.API.Models;

public record PatientDto(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    DateTime DateOfBirth,
    string PhoneNumber,
    string Address
);

public record CreatePatientDto(
    string FirstName,
    string LastName,
    string Email,
    DateTime DateOfBirth,
    string PhoneNumber,
    string Address
);

public record UpdatePatientDto(
    string FirstName,
    string LastName,
    string Email,
    DateTime DateOfBirth,
    string PhoneNumber,
    string Address
);
