using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Prometheus;

var builder = WebApplication.CreateBuilder(args);

// Configure OpenTelemetry Tracing
var otlpEndpoint = builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"] ?? "http://localhost:4317";
builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource
        .AddService(
            serviceName: "ApiGateway",
            serviceVersion: "1.0.0"))
    .WithTracing(tracing => tracing
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddOtlpExporter(options =>
        {
            options.Endpoint = new Uri(otlpEndpoint);
        }));

// Add YARP Reverse Proxy
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Get connection strings from configuration
var sqlConnection = builder.Configuration.GetConnectionString("SqlServer")
    ?? "Server=localhost,1434;Database=master;User Id=sa;Password=StrongPassword123!;TrustServerCertificate=true";
var mongoConnection = builder.Configuration.GetConnectionString("MongoDB")
    ?? "mongodb://admin:admin123@localhost:27017";
var redisConnection = builder.Configuration.GetConnectionString("Redis")
    ?? "localhost:6379";
var rabbitConnection = builder.Configuration.GetConnectionString("RabbitMQ")
    ?? "amqp://admin:admin123@localhost:5672";

// Get service URLs from configuration (Docker uses service names, local uses localhost:port)
var patientServiceUrl = builder.Configuration["ServiceUrls:PatientService"] ?? "http://localhost:5025";
var appointmentServiceUrl = builder.Configuration["ServiceUrls:AppointmentService"] ?? "http://localhost:5026";
var billingServiceUrl = builder.Configuration["ServiceUrls:BillingService"] ?? "http://localhost:5056";
var notificationServiceUrl = builder.Configuration["ServiceUrls:NotificationService"] ?? "http://localhost:5060";

// Add health checks for infrastructure
builder.Services.AddHealthChecks()
    .AddSqlServer(
        sqlConnection,
        name: "sqlserver",
        tags: ["database", "infrastructure"])
    .AddMongoDb(
        sp => new MongoDB.Driver.MongoClient(mongoConnection),
        name: "mongodb",
        tags: ["database", "infrastructure"])
    .AddRedis(
        redisConnection,
        name: "redis",
        tags: ["cache", "infrastructure"])
    .AddRabbitMQ(
        sp =>
        {
            var factory = new RabbitMQ.Client.ConnectionFactory
            {
                Uri = new Uri(rabbitConnection)
            };
            return factory.CreateConnectionAsync().GetAwaiter().GetResult();
        },
        name: "rabbitmq",
        tags: ["messaging", "infrastructure"])
    // Microservices health endpoints
    .AddUrlGroup(
        new Uri($"{patientServiceUrl}/health"),
        name: "patient-service",
        tags: ["service"])
    .AddUrlGroup(
        new Uri($"{appointmentServiceUrl}/health"),
        name: "appointment-service",
        tags: ["service"])
    .AddUrlGroup(
        new Uri($"{billingServiceUrl}/health"),
        name: "billing-service",
        tags: ["service"])
    .AddUrlGroup(
        new Uri($"{notificationServiceUrl}/health"),
        name: "notification-service",
        tags: ["service"]);

// Add Health Checks UI
var healthCheckUrl = builder.Configuration["HealthCheckUI:Url"] ?? "http://localhost:5000/health";
builder.Services.AddHealthChecksUI(options =>
{
    options.SetEvaluationTimeInSeconds(30); // Check every 30 seconds
    options.MaximumHistoryEntriesPerEndpoint(50); // Keep 50 entries per endpoint
    options.SetApiMaxActiveRequests(1); // Limit concurrent requests

    // Add health check endpoint with full URL
    options.AddHealthCheckEndpoint("Healthcare Microservices", healthCheckUrl);
})
.AddInMemoryStorage();

var app = builder.Build();

// Demo Mode: block all write operations
var demoMode = builder.Configuration.GetValue<bool>("DemoMode");
if (demoMode)
{
    app.Use(async (context, next) =>
    {
        var method = context.Request.Method;
        if (method is "POST" or "PUT" or "PATCH" or "DELETE")
        {
            context.Response.StatusCode = 403;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync("{\"error\":\"Demo mode: write operations are disabled\"}");
            return;
        }
        await next();
    });
}

// Use CORS
app.UseCors("AllowAll");

// Prometheus metrics
app.UseRouting();
app.UseHttpMetrics();

// Map health endpoint with detailed response
app.MapHealthChecks("/health", new HealthCheckOptions
{
    Predicate = _ => true,
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});

// Map Health Checks UI at /healthchecks-ui
app.MapHealthChecksUI(options =>
{
    options.UIPath = "/healthchecks-ui";
    options.ApiPath = "/healthchecks-api";
});

// Prometheus metrics endpoint
app.MapMetrics();

// Map YARP reverse proxy
app.MapReverseProxy();

app.Run();
