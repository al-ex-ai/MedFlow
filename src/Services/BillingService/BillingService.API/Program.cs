using Microsoft.EntityFrameworkCore;
using BillingService.API.Data;
using BillingService.API.Services;
using BillingService.API.Consumers;
using BillingService.API.Events;
using Serilog;
using Serilog.Events;
using StackExchange.Redis;
using MassTransit;
using Prometheus;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", "BillingService")
    .WriteTo.Console()
    .WriteTo.Seq(Environment.GetEnvironmentVariable("Seq__ServerUrl") ?? "http://localhost:5341")
    .CreateLogger();

try
{
    Log.Information("Starting Billing Service...");

    var builder = WebApplication.CreateBuilder(args);

    // Use Serilog
    builder.Host.UseSerilog();

    // Configure OpenTelemetry Tracing
    builder.Services.AddOpenTelemetry()
        .ConfigureResource(resource => resource
            .AddService(
                serviceName: "BillingService",
                serviceVersion: "1.0.0"))
        .WithTracing(tracing => tracing
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddSqlClientInstrumentation()
            .AddRedisInstrumentation()
            .AddOtlpExporter(options =>
            {
                options.Endpoint = new Uri("http://localhost:4317");
            }));

    // Add services to the container
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddOpenApi();

    // Database
    builder.Services.AddDbContext<BillingDbContext>(options =>
        options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

    // Redis
    builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
    {
        var configuration = builder.Configuration["Redis:ConnectionString"] ?? "localhost:6379";
        return ConnectionMultiplexer.Connect(configuration);
    });
    builder.Services.AddSingleton<IRedisCacheService, RedisCacheService>();

    // MassTransit with RabbitMQ
    builder.Services.AddMassTransit(x =>
    {
        // Add consumer
        x.AddConsumer<AppointmentCreatedConsumer>();

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

            // Configure the InvoiceCreatedEvent to publish to "InvoiceCreated" fanout exchange
            cfg.Message<InvoiceCreatedEvent>(x => x.SetEntityName("InvoiceCreated"));
            cfg.Publish<InvoiceCreatedEvent>(x => x.ExchangeType = "fanout");

            // Use raw JSON serializer for cross-service compatibility
            cfg.UseRawJsonSerializer(RawSerializerOptions.All);

            // Configure consumers - bind to Node.js appointment-events exchange
            cfg.ReceiveEndpoint("billing-service-appointment-queue", e =>
            {
                // Accept raw JSON from Node.js
                e.DefaultContentType = new System.Net.Mime.ContentType("application/json");
                e.UseRawJsonDeserializer(RawSerializerOptions.AnyMessageType);

                e.ConfigureConsumer<AppointmentCreatedConsumer>(context);

                // Bind to the simple fanout exchange from Node.js Appointment Service
                e.Bind("appointment-events", x =>
                {
                    x.ExchangeType = "fanout";
                });
            });
        });
    });

    // Health Checks
    builder.Services.AddHealthChecks()
        .AddSqlServer(
            builder.Configuration.GetConnectionString("DefaultConnection")!,
            name: "sqlserver",
            tags: new[] { "db", "sql" })
        .AddRedis(
            builder.Configuration["Redis:ConnectionString"]!,
            name: "redis",
            tags: new[] { "cache", "redis" });

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

    // Auto-migrate database on startup
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<BillingDbContext>();
        Log.Information("Applying database migrations...");
        db.Database.Migrate();
        Log.Information("Database migrations applied successfully");
    }

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

    Log.Information("Billing Service started successfully on port {Port}", builder.Configuration["ASPNETCORE_URLS"] ?? "http://localhost:5000");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Billing Service failed to start");
    throw;
}
finally
{
    Log.CloseAndFlush();
}
