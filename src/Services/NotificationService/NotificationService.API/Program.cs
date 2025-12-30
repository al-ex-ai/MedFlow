using NotificationService.API.Data;
using NotificationService.API.Consumers;
using Serilog;
using Serilog.Events;
using MassTransit;
using Prometheus;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", "NotificationService")
    .WriteTo.Console()
    .WriteTo.Seq(Environment.GetEnvironmentVariable("Seq__ServerUrl") ?? "http://localhost:5341")
    .CreateLogger();

try
{
    Log.Information("Starting Notification Service...");

    var builder = WebApplication.CreateBuilder(args);

    // Use Serilog
    builder.Host.UseSerilog();

    // Add services to the container
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddOpenApi();

    // MongoDB
    var mongoSettings = new MongoDbSettings
    {
        ConnectionString = builder.Configuration["MongoDb:ConnectionString"] ?? "mongodb://admin:admin123@localhost:27017",
        DatabaseName = builder.Configuration["MongoDb:DatabaseName"] ?? "NotificationDb"
    };
    builder.Services.AddSingleton(mongoSettings);
    builder.Services.AddSingleton<NotificationDbContext>();

    // MassTransit with RabbitMQ
    builder.Services.AddMassTransit(x =>
    {
        // Add consumers
        x.AddConsumer<AppointmentCreatedConsumer>();
        x.AddConsumer<InvoiceCreatedConsumer>();

        x.UsingRabbitMq((context, cfg) =>
        {
            var rabbitHost = builder.Configuration["RabbitMQ:Host"] ?? "localhost";
            var rabbitUser = builder.Configuration["RabbitMQ:Username"] ?? "admin";
            var rabbitPass = builder.Configuration["RabbitMQ:Password"] ?? "admin123";

            cfg.Host(rabbitHost, "/", h =>
            {
                h.Username(rabbitUser);
                h.Password(rabbitPass);
            });

            // Configure consumer for Appointment events from Node.js
            cfg.ReceiveEndpoint("notification-service-appointment-queue", e =>
            {
                // Accept raw JSON from Node.js
                e.DefaultContentType = new System.Net.Mime.ContentType("application/json");
                e.UseRawJsonDeserializer(RawSerializerOptions.AnyMessageType);

                e.ConfigureConsumer<AppointmentCreatedConsumer>(context);

                // Bind to the fanout exchange from Node.js Appointment Service
                e.Bind("appointment-events", x =>
                {
                    x.ExchangeType = "fanout";
                });
            });

            // Configure consumer for Invoice events from Billing Service (.NET/MassTransit)
            cfg.ReceiveEndpoint("notification-service-invoice-queue", e =>
            {
                e.ConfigureConsumer<InvoiceCreatedConsumer>(context);
            });
        });
    });

    // Health Checks
    builder.Services.AddHealthChecks()
        .AddMongoDb(
            _ => new MongoDB.Driver.MongoClient(mongoSettings.ConnectionString),
            name: "mongodb",
            tags: new[] { "db", "mongodb" });

    // CORS
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAll", policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
    });

    var app = builder.Build();

    // Configure the HTTP request pipeline
    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
    }

    app.UseCors("AllowAll");

    // Prometheus metrics
    app.UseRouting();
    app.UseHttpMetrics();

    app.UseAuthorization();

    app.MapControllers();
    app.MapMetrics();

    // Health checks endpoint
    app.MapHealthChecks("/health", new HealthCheckOptions
    {
        ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
    });

    Log.Information("Notification Service started successfully on port {Port}", builder.Configuration["ASPNETCORE_URLS"] ?? "http://localhost:5000");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Notification Service failed to start");
    throw;
}
finally
{
    Log.CloseAndFlush();
}
