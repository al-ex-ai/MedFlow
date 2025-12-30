import { getChannel } from './eventPublisher.js';
import logger from '../config/logger.js';

const consumePatientEvents = async () => {
  try {
    const channel = getChannel();
    if (!channel) {
      logger.error('RabbitMQ channel not available for consuming');
      return;
    }

    // MassTransit uses message type-based exchange names
    // PatientCreatedEvent in namespace PatientService.API.Events
    const exchangeName = 'PatientService.API.Events:PatientCreatedEvent';
    const queueName = 'appointment-service-patient-queue';

    await channel.assertExchange(exchangeName, 'fanout', { durable: true });
    await channel.assertQueue(queueName, { durable: true });
    await channel.bindQueue(queueName, exchangeName, '');

    logger.info(`Waiting for PatientCreated events on queue: ${queueName}`);

    channel.consume(queueName, async (msg) => {
      if (msg !== null) {
        try {
          const event = JSON.parse(msg.content.toString());

          // MassTransit wraps the message in a message envelope
          const messageData = event.message || event;

          logger.info(`Received PatientCreated event: ${messageData.patientId || messageData.PatientId}`);
          logger.info(`Patient: ${messageData.firstName || messageData.FirstName} ${messageData.lastName || messageData.LastName}`);

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
