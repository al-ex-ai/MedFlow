-- Healthcare Microservices - Database Initialization
-- This script creates all databases for the microservices

-- Create PatientDb
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'PatientDb')
BEGIN
    CREATE DATABASE PatientDb;
    PRINT 'PatientDb created successfully';
END
GO

-- Create BillingDb
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'BillingDb')
BEGIN
    CREATE DATABASE BillingDb;
    PRINT 'BillingDb created successfully';
END
GO

PRINT 'All databases initialized successfully';
