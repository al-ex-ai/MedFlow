using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BillingService.API.Data;
using BillingService.API.Models;
using BillingService.API.Services;
using BillingService.API.Events;
using MassTransit;

namespace BillingService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly BillingDbContext _context;
    private readonly IRedisCacheService _cache;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<InvoicesController> _logger;

    public InvoicesController(
        BillingDbContext context,
        IRedisCacheService cache,
        IPublishEndpoint publishEndpoint,
        ILogger<InvoicesController> logger)
    {
        _context = context;
        _cache = cache;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<InvoiceDto>>> GetAllInvoices()
    {
        _logger.LogInformation("Getting all invoices");

        var invoices = await _context.Invoices
            .OrderByDescending(i => i.IssuedDate)
            .ToListAsync();

        var invoiceDtos = invoices.Select(i => new InvoiceDto(
            i.Id,
            i.AppointmentId,
            i.PatientId,
            i.PatientName,
            i.PatientEmail,
            i.Amount,
            i.Currency,
            i.Status,
            i.Description,
            i.IssuedDate,
            i.DueDate,
            i.PaidDate
        ));

        return Ok(invoiceDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<InvoiceDto>> GetInvoice(Guid id)
    {
        _logger.LogInformation("Getting invoice with ID: {InvoiceId}", id);

        // Try cache first
        var cacheKey = $"invoice:{id}";
        var cachedInvoice = await _cache.GetAsync<InvoiceDto>(cacheKey);

        if (cachedInvoice != null)
        {
            return Ok(cachedInvoice);
        }

        var invoice = await _context.Invoices.FindAsync(id);

        if (invoice == null)
        {
            _logger.LogWarning("Invoice not found: {InvoiceId}", id);
            return NotFound();
        }

        var invoiceDto = new InvoiceDto(
            invoice.Id,
            invoice.AppointmentId,
            invoice.PatientId,
            invoice.PatientName,
            invoice.PatientEmail,
            invoice.Amount,
            invoice.Currency,
            invoice.Status,
            invoice.Description,
            invoice.IssuedDate,
            invoice.DueDate,
            invoice.PaidDate
        );

        await _cache.SetAsync(cacheKey, invoiceDto, TimeSpan.FromMinutes(5));

        return Ok(invoiceDto);
    }

    [HttpGet("patient/{patientId}")]
    public async Task<ActionResult<IEnumerable<InvoiceDto>>> GetInvoicesByPatient(Guid patientId)
    {
        _logger.LogInformation("Getting invoices for patient: {PatientId}", patientId);

        var invoices = await _context.Invoices
            .Where(i => i.PatientId == patientId)
            .OrderByDescending(i => i.IssuedDate)
            .ToListAsync();

        var invoiceDtos = invoices.Select(i => new InvoiceDto(
            i.Id,
            i.AppointmentId,
            i.PatientId,
            i.PatientName,
            i.PatientEmail,
            i.Amount,
            i.Currency,
            i.Status,
            i.Description,
            i.IssuedDate,
            i.DueDate,
            i.PaidDate
        ));

        return Ok(invoiceDtos);
    }

    [HttpPost]
    public async Task<ActionResult<InvoiceDto>> CreateInvoice(CreateInvoiceDto createDto)
    {
        _logger.LogInformation("Creating new invoice for appointment: {AppointmentId}", createDto.AppointmentId);

        var invoice = new Invoice
        {
            Id = Guid.NewGuid(),
            AppointmentId = createDto.AppointmentId,
            PatientId = createDto.PatientId,
            PatientName = createDto.PatientName,
            PatientEmail = createDto.PatientEmail,
            Amount = createDto.Amount,
            Description = createDto.Description,
            IssuedDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow
        };

        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Invoice created with ID: {InvoiceId}", invoice.Id);

        // Publish event
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

        var invoiceDto = new InvoiceDto(
            invoice.Id,
            invoice.AppointmentId,
            invoice.PatientId,
            invoice.PatientName,
            invoice.PatientEmail,
            invoice.Amount,
            invoice.Currency,
            invoice.Status,
            invoice.Description,
            invoice.IssuedDate,
            invoice.DueDate,
            invoice.PaidDate
        );

        await _cache.SetAsync($"invoice:{invoice.Id}", invoiceDto, TimeSpan.FromMinutes(5));

        return CreatedAtAction(nameof(GetInvoice), new { id = invoice.Id }, invoiceDto);
    }

    [HttpPost("{id}/pay")]
    public async Task<ActionResult<InvoiceDto>> PayInvoice(Guid id)
    {
        _logger.LogInformation("Processing payment for invoice: {InvoiceId}", id);

        var invoice = await _context.Invoices.FindAsync(id);

        if (invoice == null)
        {
            return NotFound();
        }

        if (invoice.Status == InvoiceStatus.Paid)
        {
            return BadRequest("Invoice is already paid");
        }

        invoice.Status = InvoiceStatus.Paid;
        invoice.PaidDate = DateTime.UtcNow;
        invoice.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Invoice paid: {InvoiceId}", id);

        // Publish event
        var invoicePaidEvent = new InvoicePaidEvent(
            invoice.Id,
            invoice.AppointmentId,
            invoice.PatientId,
            invoice.Amount,
            invoice.PaidDate.Value
        );

        await _publishEndpoint.Publish(invoicePaidEvent);
        _logger.LogInformation("Published InvoicePaidEvent for invoice: {InvoiceId}", invoice.Id);

        var invoiceDto = new InvoiceDto(
            invoice.Id,
            invoice.AppointmentId,
            invoice.PatientId,
            invoice.PatientName,
            invoice.PatientEmail,
            invoice.Amount,
            invoice.Currency,
            invoice.Status,
            invoice.Description,
            invoice.IssuedDate,
            invoice.DueDate,
            invoice.PaidDate
        );

        await _cache.SetAsync($"invoice:{id}", invoiceDto, TimeSpan.FromMinutes(5));

        return Ok(invoiceDto);
    }
}
