using MassTransit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PatientService.API.Data;
using PatientService.API.Events;
using PatientService.API.Models;
using PatientService.API.Services;

namespace PatientService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PatientsController : ControllerBase
{
    private readonly PatientDbContext _context;
    private readonly IRedisCacheService _cache;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<PatientsController> _logger;

    public PatientsController(
        PatientDbContext context,
        IRedisCacheService cache,
        IPublishEndpoint publishEndpoint,
        ILogger<PatientsController> logger)
    {
        _context = context;
        _cache = cache;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PatientDto>>> GetPatients()
    {
        _logger.LogInformation("Getting all patients");

        var patients = await _context.Patients
            .OrderByDescending(p => p.CreatedAt)
            .Take(100)
            .ToListAsync();

        var patientDtos = patients.Select(p => new PatientDto(
            p.Id,
            p.FirstName,
            p.LastName,
            p.Email,
            p.DateOfBirth,
            p.PhoneNumber,
            p.Address
        ));

        return Ok(patientDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PatientDto>> GetPatient(Guid id)
    {
        _logger.LogInformation("Getting patient with ID: {PatientId}", id);

        // Try cache first
        var cacheKey = $"patient:{id}";
        var cachedPatient = await _cache.GetAsync<PatientDto>(cacheKey);

        if (cachedPatient != null)
        {
            return Ok(cachedPatient);
        }

        // Cache miss - query database
        var patient = await _context.Patients.FindAsync(id);

        if (patient == null)
        {
            _logger.LogWarning("Patient not found: {PatientId}", id);
            return NotFound();
        }

        var patientDto = new PatientDto(
            patient.Id,
            patient.FirstName,
            patient.LastName,
            patient.Email,
            patient.DateOfBirth,
            patient.PhoneNumber,
            patient.Address
        );

        // Cache for 5 minutes
        await _cache.SetAsync(cacheKey, patientDto, TimeSpan.FromMinutes(5));

        return Ok(patientDto);
    }

    [HttpPost]
    public async Task<ActionResult<PatientDto>> CreatePatient(CreatePatientDto createDto)
    {
        _logger.LogInformation("Creating new patient: {Email}", createDto.Email);

        // Check if email already exists
        if (await _context.Patients.AnyAsync(p => p.Email == createDto.Email))
        {
            _logger.LogWarning("Email already exists: {Email}", createDto.Email);
            return Conflict(new { message = "Email already exists" });
        }

        var patient = new Patient
        {
            Id = Guid.NewGuid(),
            FirstName = createDto.FirstName,
            LastName = createDto.LastName,
            Email = createDto.Email,
            DateOfBirth = createDto.DateOfBirth,
            PhoneNumber = createDto.PhoneNumber,
            Address = createDto.Address,
            CreatedAt = DateTime.UtcNow
        };

        _context.Patients.Add(patient);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Patient created with ID: {PatientId}", patient.Id);

        // Publish event to RabbitMQ
        var patientCreatedEvent = new PatientCreatedEvent(
            patient.Id,
            patient.FirstName,
            patient.LastName,
            patient.Email,
            patient.CreatedAt
        );

        await _publishEndpoint.Publish(patientCreatedEvent);
        _logger.LogInformation("Published PatientCreatedEvent for patient: {PatientId}", patient.Id);

        var patientDto = new PatientDto(
            patient.Id,
            patient.FirstName,
            patient.LastName,
            patient.Email,
            patient.DateOfBirth,
            patient.PhoneNumber,
            patient.Address
        );

        // Cache the new patient
        await _cache.SetAsync($"patient:{patient.Id}", patientDto, TimeSpan.FromMinutes(5));

        return CreatedAtAction(nameof(GetPatient), new { id = patient.Id }, patientDto);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<PatientDto>> UpdatePatient(Guid id, UpdatePatientDto updateDto)
    {
        _logger.LogInformation("Updating patient: {PatientId}", id);

        var patient = await _context.Patients.FindAsync(id);

        if (patient == null)
        {
            _logger.LogWarning("Patient not found: {PatientId}", id);
            return NotFound();
        }

        // Check if email is being changed and if it already exists
        if (updateDto.Email != patient.Email &&
            await _context.Patients.AnyAsync(p => p.Email == updateDto.Email))
        {
            _logger.LogWarning("Email already exists: {Email}", updateDto.Email);
            return Conflict(new { message = "Email already exists" });
        }

        patient.FirstName = updateDto.FirstName;
        patient.LastName = updateDto.LastName;
        patient.Email = updateDto.Email;
        patient.DateOfBirth = updateDto.DateOfBirth;
        patient.PhoneNumber = updateDto.PhoneNumber;
        patient.Address = updateDto.Address;
        patient.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Patient updated: {PatientId}", id);

        // Publish update event
        var patientUpdatedEvent = new PatientUpdatedEvent(
            patient.Id,
            patient.FirstName,
            patient.LastName,
            patient.UpdatedAt.Value
        );

        await _publishEndpoint.Publish(patientUpdatedEvent);
        _logger.LogInformation("Published PatientUpdatedEvent for patient: {PatientId}", patient.Id);

        var patientDto = new PatientDto(
            patient.Id,
            patient.FirstName,
            patient.LastName,
            patient.Email,
            patient.DateOfBirth,
            patient.PhoneNumber,
            patient.Address
        );

        // Update cache
        await _cache.SetAsync($"patient:{patient.Id}", patientDto, TimeSpan.FromMinutes(5));

        return Ok(patientDto);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePatient(Guid id)
    {
        _logger.LogInformation("Deleting patient: {PatientId}", id);

        var patient = await _context.Patients.FindAsync(id);

        if (patient == null)
        {
            _logger.LogWarning("Patient not found: {PatientId}", id);
            return NotFound();
        }

        _context.Patients.Remove(patient);
        await _context.SaveChangesAsync();

        // Remove from cache
        await _cache.RemoveAsync($"patient:{id}");

        _logger.LogInformation("Patient deleted: {PatientId}", id);

        return NoContent();
    }
}
