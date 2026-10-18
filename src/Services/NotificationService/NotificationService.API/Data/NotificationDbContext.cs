using MongoDB.Driver;
using NotificationService.API.Models;

namespace NotificationService.API.Data;

public class NotificationDbContext
{
    private readonly IMongoDatabase _database;

    public NotificationDbContext(IConfiguration configuration)
    {
        var connectionString = configuration["MongoDB:ConnectionString"]
            ?? throw new InvalidOperationException("MongoDB:ConnectionString is not configured. Set MongoDB__ConnectionString.");
        var databaseName = configuration["MongoDB:DatabaseName"] ?? "NotificationDb";

        var client = new MongoClient(connectionString);
        _database = client.GetDatabase(databaseName);
    }

    public IMongoCollection<Notification> Notifications =>
        _database.GetCollection<Notification>("notifications");
}
