using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using NotificationService.API.Data;
using NotificationService.API.Models;

namespace NotificationService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly NotificationDbContext _context;
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(
        NotificationDbContext context,
        ILogger<NotificationsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        _logger.LogInformation("Getting all notifications");

        var notifications = await _context.Notifications
            .Find(_ => true)
            .SortByDescending(n => n.CreatedAt)
            .Limit(100)
            .ToListAsync();

        return Ok(notifications);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        _logger.LogInformation("Getting notification with ID: {Id}", id);

        var notification = await _context.Notifications
            .Find(n => n.Id == id)
            .FirstOrDefaultAsync();

        if (notification == null)
        {
            return NotFound();
        }

        return Ok(notification);
    }

    [HttpGet("by-email/{email}")]
    public async Task<IActionResult> GetByEmail(string email)
    {
        _logger.LogInformation("Getting notifications for email: {Email}", email);

        var notifications = await _context.Notifications
            .Find(n => n.RecipientEmail == email)
            .SortByDescending(n => n.CreatedAt)
            .ToListAsync();

        return Ok(notifications);
    }

    [HttpGet("by-status/{status}")]
    public async Task<IActionResult> GetByStatus(NotificationStatus status)
    {
        _logger.LogInformation("Getting notifications with status: {Status}", status);

        var notifications = await _context.Notifications
            .Find(n => n.Status == status)
            .SortByDescending(n => n.CreatedAt)
            .ToListAsync();

        return Ok(notifications);
    }
}
