import { cleanupOldMemories } from '../services/memoryService.js';

const DAILY_CLEANUP_SCHEDULE = '0 4 * * *'; // 4AM daily

export function scheduleMaintenanceJobs() {
  cron.schedule(DAILY_CLEANUP_SCHEDULE, async () => {
    console.log('Running daily maintenance...');
    await cleanupOldMemories(365); // Keep 1 year of data
  });
} 