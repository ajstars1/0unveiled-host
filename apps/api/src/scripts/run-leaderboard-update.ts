import { updateLeaderboards } from '../services/leaderboard-service.js';

updateLeaderboards()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    process.exit(1);
  });
