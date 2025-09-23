import dotenv from 'dotenv';
import { updateLeaderboards } from '../services/leaderboard-service.js';

// Load environment variables from the API directory
dotenv.config({ path: '.env' });

updateLeaderboards()
  .then(() => {
    console.log('✅ Leaderboard update completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Leaderboard update failed:', error);
    process.exit(1);
  });
