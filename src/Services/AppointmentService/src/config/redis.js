import { createClient } from 'redis';
import logger from './logger.js';

let redisClient = null;

const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL
    });

    redisClient.on('error', (err) => {
      logger.error(`Redis error: ${err.message}`);
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });

    redisClient.on('disconnect', () => {
      logger.warn('Redis disconnected');
    });

    await redisClient.connect();

    return redisClient;
  } catch (error) {
    logger.error(`Redis connection failed: ${error.message}`);
    return null;
  }
};

const getRedisClient = () => redisClient;

const cacheGet = async (key) => {
  try {
    if (!redisClient || !redisClient.isOpen) return null;

    const value = await redisClient.get(key);
    if (value) {
      logger.info(`Cache hit for key: ${key}`);
      return JSON.parse(value);
    }
    logger.info(`Cache miss for key: ${key}`);
    return null;
  } catch (error) {
    logger.error(`Cache get error for key ${key}: ${error.message}`);
    return null;
  }
};

const cacheSet = async (key, value, expirationSeconds = 300) => {
  try {
    if (!redisClient || !redisClient.isOpen) return false;

    await redisClient.setEx(key, expirationSeconds, JSON.stringify(value));
    logger.info(`Cached value for key: ${key} with expiration: ${expirationSeconds}s`);
    return true;
  } catch (error) {
    logger.error(`Cache set error for key ${key}: ${error.message}`);
    return false;
  }
};

const cacheDel = async (key) => {
  try {
    if (!redisClient || !redisClient.isOpen) return false;

    await redisClient.del(key);
    logger.info(`Removed cache for key: ${key}`);
    return true;
  } catch (error) {
    logger.error(`Cache delete error for key ${key}: ${error.message}`);
    return false;
  }
};

export { connectRedis, getRedisClient, cacheGet, cacheSet, cacheDel };
