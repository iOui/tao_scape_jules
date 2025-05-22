import { NextResponse } from 'next/server';
// Browser and Page are typically used as types. If puppeteer itself is not called here, this import might be removable.
// However, the objects returned by loginToApp are instances of Browser and Page.
// For safety in JS, we can keep the import if there's any runtime check or expectation.
// Given the context, it's safer to keep it.
import { Browser, Page } from 'puppeteer'; // Kept for now, might be optimized if not strictly needed in JS runtime.

import { loginToApp } from '../../../lib/login';
import { scrapeData } from '../../../lib/scraper'; // BillItem interface removed
import { createTableIfNotExists, insertBillData } from '../../../lib/database';
// closePool is available but typically not called per-request in an API route

export async function POST(request) {
  console.log('Scrape API route hit (POST).');

  let browser = null;
  // page variable is not strictly needed here as it's scoped within the try block

  try {
    console.log('Ensuring database table exists...');
    await createTableIfNotExists();
    console.log('Database table check complete.');

    console.log('Login process started...');
    const loginResult = await loginToApp();
    browser = loginResult.browser; // Assign browser here to be accessible in finally
    const page = loginResult.page;
    console.log('Login successful. Starting scraping process...');

    const billItems = await scrapeData(page);
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
  } catch (error) {
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
export async function GET(request) {
  return NextResponse.json({ message: 'Scrape API is reachable. Use POST to trigger scraping.' });
}
