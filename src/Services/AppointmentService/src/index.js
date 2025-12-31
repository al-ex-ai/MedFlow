import './tracing.js';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/database.js';
import { connectRedis } from './config/redis.js';
import { connectRabbitMQ } from './events/eventPublisher.js';
import { consumePatientEvents } from './events/eventConsumer.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import { metricsMiddleware, metricsEndpoint } from './middleware/metrics.js';
import logger from './config/logger.js';
import mongoose from 'mongoose';
import { getRedisClient } from './config/redis.js';
import { getChannel } from './events/eventPublisher.js';

const app = express();
const PORT = process.env.PORT || 5026;

// Middleware
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);

// Routes
app.use('/api/appointments', appointmentRoutes);

// Metrics endpoint
app.get('/metrics', metricsEndpoint);

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'Healthy',
    timestamp: new Date().toISOString(),
    checks: {
      mongodb: 'Unhealthy',
      redis: 'Unhealthy',
      rabbitmq: 'Unhealthy'
    }
  };

  try {
    // Check MongoDB
    if (mongoose.connection.readyState === 1) {
      health.checks.mongodb = 'Healthy';
    }

    // Check Redis
    const redisClient = getRedisClient();
    if (redisClient && redisClient.isOpen) {
      await redisClient.ping();
      health.checks.redis = 'Healthy';
    }

    // Check RabbitMQ
    const rabbitChannel = getChannel();
    if (rabbitChannel) {
      health.checks.rabbitmq = 'Healthy';
    }

    // Overall health status
    const allHealthy = Object.values(health.checks).every(status => status === 'Healthy');
    health.status = allHealthy ? 'Healthy' : 'Degraded';

    res.status(allHealthy ? 200 : 503).json(health);
  } catch (error) {
    logger.error(`Health check error: ${error.message}`);
    health.status = 'Unhealthy';
    res.status(503).json(health);
  }
});

// Start server
const startServer = async () => {
  try {
    logger.info('Starting Appointment Service...');

    // Connect to MongoDB
    await connectDB();

    // Connect to Redis
    await connectRedis();

    // Connect to RabbitMQ
    await connectRabbitMQ();

    // Start consuming patient events
    await consumePatientEvents();

    app.listen(PORT, () => {
      logger.info(`Appointment Service started successfully on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Metrics: http://localhost:${PORT}/metrics`);
    });
  } catch (error) {
    logger.error(`Failed to start Appointment Service: ${error.message}`);
    process.exit(1);
  }
};

startServer();
