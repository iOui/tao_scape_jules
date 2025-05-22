// instrumentation.js
import { initializeScheduledJobs } from './lib/scheduler'; // if lib is at root
// import { initializeScheduledJobs } from '@/lib/scheduler'; // if using src dir and alias

export async function register() {
  console.log("Instrumentation: Registering scheduled jobs...");
  // Ensure this runs only on the server side, not in the browser or during build if not intended.
  // Next.js runs this hook only on the server.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    initializeScheduledJobs();
  } else {
    // console.log("Instrumentation: Not running scheduler in this environment (e.g. browser, edge).");
  }
}
