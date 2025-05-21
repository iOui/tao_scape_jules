import { NextResponse } from 'next/server';
import { Browser, Page } from 'puppeteer';

import { loginToApp } from '@/lib/login'; // Using import alias @
import { scrapeData, BillItem } from '@/lib/scraper';
import { createTableIfNotExists, insertBillData } from '@/lib/database';
// closePool is available but typically not called per-request in an API route

export async function POST(request: Request) {
  console.log('Scrape API route hit (POST).');

  let browser: Browser | null = null;
  // page variable is not strictly needed here as it's scoped within the try block

  try {
    console.log('Ensuring database table exists...');
    await createTableIfNotExists();
    console.log('Database table check complete.');

    console.log('Login process started...');
    const loginResult = await loginToApp();
    browser = loginResult.browser; // Assign browser here to be accessible in finally
    const page: Page = loginResult.page;
    console.log('Login successful. Starting scraping process...');

    const billItems: BillItem[] = await scrapeData(page);
    console.log(`Scraped ${billItems.length} items. Inserting into database...`);

    if (billItems.length > 0) {
      await insertBillData(billItems);
      console.log('Data insertion complete.');
    } else {
      console.log('No items to insert into the database.');
    }

    return NextResponse.json(
      { message: 'Scraping and data processing successful', itemsScraped: billItems.length },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('An error occurred during the scraping process:', error);
    // Ensure error.message is passed, or a default message if it's not an Error instance
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { message: 'An error occurred during the scraping process', error: errorMessage },
      { status: 500 }
    );
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log('Browser closed successfully.');
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    } else {
      console.log('Browser instance was not created or already closed.');
    }
    // Not calling closePool() here, as the pool is typically managed globally for API routes.
  }
}

// Basic GET handler for testing if the route is reachable (optional)
export async function GET(request: Request) {
  return NextResponse.json({ message: 'Scrape API is reachable. Use POST to trigger scraping.' });
}
