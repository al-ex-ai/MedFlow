using NotificationService.API.Data;
using NotificationService.API.Consumers;
using NotificationService.API.Events;
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

            // Map BillingService message type to our local type
            cfg.Message<InvoiceCreatedEvent>(x => x.SetEntityName("InvoiceCreated"));

            // Configure consumer for Invoice events from Billing Service (.NET MassTransit format)
            cfg.ReceiveEndpoint("notification-service-invoice-queue", e =>
            {
                // Use raw JSON deserializer to accept messages from BillingService regardless of namespace
                e.DefaultContentType = new System.Net.Mime.ContentType("application/json");
                e.UseRawJsonDeserializer(RawSerializerOptions.AnyMessageType);

                e.ConfigureConsumer<InvoiceCreatedConsumer>(context);

                // Bind to the "InvoiceCreated" exchange
                e.Bind("InvoiceCreated", x =>
                {
                    x.ExchangeType = "fanout";
                });
            });
        });
    });

    // Health Checks
    var mongoConnectionString = builder.Configuration["MongoDB:ConnectionString"] ?? "mongodb://admin:admin123@localhost:27017";
    builder.Services.AddHealthChecks()
        .AddMongoDb(
            _ => new MongoDB.Driver.MongoClient(mongoConnectionString),
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
