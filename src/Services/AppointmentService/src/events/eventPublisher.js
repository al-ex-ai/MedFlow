import amqp from 'amqplib';
import logger from '../config/logger.js';

let channel = null;
let connection = null;

const connectRabbitMQ = async () => {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    logger.info('RabbitMQ connected');

    connection.on('error', (err) => {
      logger.error(`RabbitMQ connection error: ${err.message}`);
    });

    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed');
    });

    return channel;
  } catch (error) {
    logger.error(`RabbitMQ connection failed: ${error.message}`);
    return null;
  }
};

const publishEvent = async (exchangeName, eventType, eventData) => {
  try {
    if (!channel) {
      logger.error('RabbitMQ channel not available');
      return false;
    }

    await channel.assertExchange(exchangeName, 'fanout', { durable: true });

    const message = {
      eventType,
      data: eventData,
      timestamp: new Date().toISOString()
    };

    channel.publish(
      exchangeName,
      '',
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );

    logger.info(`Published ${eventType} event to exchange: ${exchangeName}`);
    return true;
  } catch (error) {
    logger.error(`Failed to publish event ${eventType}: ${error.message}`);
    return false;
  }
};

const getChannel = () => channel;

const closeRabbitMQ = async () => {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    logger.info('RabbitMQ connection closed');
  } catch (error) {
    logger.error(`Error closing RabbitMQ: ${error.message}`);
  }
};

process.on('SIGINT', async () => {
  await closeRabbitMQ();
  process.exit(0);
});

export { connectRabbitMQ, publishEvent, getChannel, closeRabbitMQ };
