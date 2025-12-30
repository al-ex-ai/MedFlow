import winston from 'winston';
import fetch from 'node-fetch';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `[${timestamp}] ${level}: ${stack || message}`;
});

// Seq transport
class SeqTransport extends winston.Transport {
  constructor(opts) {
    super(opts);
    this.seqUrl = opts.seqUrl;
  }

  async log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    const { level, message, timestamp, ...meta } = info;

    const logEvent = {
      '@t': timestamp,
      '@l': level.toUpperCase(),
      '@mt': message,
      Service: 'AppointmentService',
      ...meta
    };

    try {
      await fetch(`${this.seqUrl}/api/events/raw?clef`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEvent)
      });
    } catch (error) {
      console.error('Failed to send log to Seq:', error.message);
    }

    callback();
  }
}

const logger = winston.createLogger({
  level: 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'HH:mm:ss' })
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        consoleFormat
      )
    })
  ]
});

// Add Seq transport if URL is provided
if (process.env.SEQ_URL) {
  logger.add(new SeqTransport({ seqUrl: process.env.SEQ_URL }));
}

export default logger;
