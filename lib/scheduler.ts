import cron from 'node-cron';

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SCRAPE_API_ENDPOINT = `${API_BASE_URL}/api/scrape`;

// Define the cron schedules
const CRON_SCHEDULES = [
  '10 17 * * *', // 5:10 PM
  '30 18 * * *', // 6:30 PM
  '50 19 * * *', // 7:50 PM
];

async function triggerScrapeAPI(schedule: string) {
  console.log(`[Cron Job ${schedule}] Triggering scrape API call to ${SCRAPE_API_ENDPOINT}`);
  try {
    const response = await fetch(SCRAPE_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any other necessary headers, e.g., an API key if you implement one
      },
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`[Cron Job ${schedule}] API call successful: ${JSON.stringify(result)}`);
    } else {
      const errorResult = await response.text();
      console.error(`[Cron Job ${schedule}] API call failed with status ${response.status}: ${errorResult}`);
    }
  } catch (error) {
    console.error(`[Cron Job ${schedule}] Error calling scrape API:`, error);
  }
}

export function initializeScheduledJobs() {
  console.log('Initializing scheduled jobs...');

  CRON_SCHEDULES.forEach(schedule => {
    if (cron.validate(schedule)) {
      cron.schedule(schedule, () => {
        console.log(`[Cron Job ${schedule}] Job triggered at ${new Date().toISOString()}`);
        triggerScrapeAPI(schedule);
      }, {
        scheduled: true,
        timezone: "Asia/Vientiane" // Example: Set to your target timezone if necessary
      });
      console.log(`Job scheduled for: ${schedule} (Timezone: Asia/Vientiane)`);
    } else {
      console.error(`Invalid cron schedule: ${schedule}`);
    }
  });

  console.log('All cron jobs have been scheduled.');
}
