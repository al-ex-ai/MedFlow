# Message Schemas

This directory contains JSON Schema definitions for all events in the microservices system.

## Purpose
- Provides a single source of truth for message contracts
- Enables independent service development without code dependencies
- Allows validation of messages at runtime
- Supports both .NET and Node.js services

## Schemas

### PatientCreated.schema.json
Published by: **PatientService**
Consumed by: **AppointmentService**

### AppointmentCreated.schema.json
Published by: **AppointmentService**
Consumed by: **BillingService**, **NotificationService**

### InvoiceCreated.schema.json
Published by: **BillingService**
Consumed by: **NotificationService**

## Usage

### In .NET Services
Use `NJsonSchema` library to validate messages against schemas.

### In Node.js Services
Use `ajv` library to validate messages against schemas.

## Schema Registry Metadata

Each schema includes:
- `$schema`: JSON Schema version
- `$id`: Unique identifier for the schema
- `title`: Human-readable name
- `description`: Purpose of the event
- `required`: Required fields
- `properties`: Field definitions with types and validation rules
