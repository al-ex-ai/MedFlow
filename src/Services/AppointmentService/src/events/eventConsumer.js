import { getChannel } from './eventPublisher.js';
import logger from '../config/logger.js';

const consumePatientEvents = async () => {
  try {
    const channel = getChannel();
    if (!channel) {
      logger.error('RabbitMQ channel not available for consuming');
      return;
    }

    const exchangeName = 'patient-events';
    const queueName = 'appointment-service-patient-queue';

    await channel.assertExchange(exchangeName, 'fanout', { durable: true });
    await channel.assertQueue(queueName, { durable: true });
    await channel.bindQueue(queueName, exchangeName, '');

    logger.info(`Waiting for patient events on queue: ${queueName}`);

    channel.consume(queueName, async (msg) => {
      if (msg !== null) {
        try {
          const event = JSON.parse(msg.content.toString());
          logger.info(`Received event: ${event.eventType}`);

          // Handle different event types
          switch (event.eventType) {
            case 'PatientCreated':
              logger.info(`Patient created: ${event.data.patientId} - ${event.data.firstName} ${event.data.lastName}`);
              // Here you could update local cache or perform other actions
              break;
            case 'PatientUpdated':
              logger.info(`Patient updated: ${event.data.patientId}`);
              break;
            case 'PatientDeleted':
              logger.info(`Patient deleted: ${event.data.patientId}`);
              break;
            default:
              logger.warn(`Unknown event type: ${event.eventType}`);
          }

          channel.ack(msg);
        } catch (error) {
          logger.error(`Error processing patient event: ${error.message}`);
          channel.nack(msg, false, false);
        }
      }
    });

  } catch (error) {
    logger.error(`Error setting up patient event consumer: ${error.message}`);
  }
};

export { consumePatientEvents };
