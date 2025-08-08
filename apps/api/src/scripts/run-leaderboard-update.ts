import { updateLeaderboards } from '../services/leaderboard-service.js';
import { logger } from '../lib/logger.js';

logger.info('Starting leaderboard update process...');

updateLeaderboards()
  .then(() => {
    logger.info('Leaderboard update process completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Failed to update leaderboards:', error);
    process.exit(1);
  });
