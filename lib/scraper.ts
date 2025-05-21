import { Page } from 'puppeteer';

// Define a structure for the bill items
export interface BillItem {
  billId: string | null;
  trackingId: string | null;
  customerName: string | null;
  phone: string | null;
  address: string | null;
  productDetails: string | null;
  codAmount: string | null; // Cash on Delivery amount
  status: string | null;
  // Add other relevant fields as they are identified
}

export async function scrapeData(page: Page): Promise<BillItem[]> {
  try {
    // 1. Construct the URL for the data page
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    const dataUrl = `https://app.anousith-express.com/nextday/item_bill/bill_item?startDate=${formattedDate}&endDate=${formattedDate}`;

    console.log(`Navigating to data page: ${dataUrl}`);
    await page.goto(dataUrl, { waitUntil: 'networkidle2' });
    console.log('Successfully navigated to data page.');

    // For debugging selectors - can be enabled if needed during integration
    // const pageContent = await page.content();
    // console.log('Page Content:', pageContent.substring(0, 5000)); // Log first 5000 chars

    // 4. & 5. Inspect the page structure and extract data
    // This is an assumed structure. Selectors will likely need adjustment.
    // Assumption: Data is in a table, each row is an item.
    console.log('Attempting to scrape data from table...');
    const billItems = await page.$$eval('table tbody tr', (rows) => {
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        // Map cells to BillItem properties based on assumed column order
        // This order is a guess and needs verification.
        return {
          billId: cells[0]?.textContent?.trim() || null,         // Example: First column
          trackingId: cells[1]?.textContent?.trim() || null,    // Example: Second column
          customerName: cells[2]?.textContent?.trim() || null,  // Example: Third column
          phone: cells[3]?.textContent?.trim() || null,
          address: cells[4]?.textContent?.trim() || null,
          productDetails: cells[5]?.textContent?.trim() || null,
          codAmount: cells[6]?.textContent?.trim() || null,
          status: cells[7]?.textContent?.trim() || null,        // Example: Eighth column
        };
      }).filter(item => item.billId || item.trackingId); // Filter out potential header/empty rows
    });

    if (billItems.length === 0) {
      console.warn(`No bill items found on ${formattedDate}. The table might be empty or selectors might be incorrect.`);
      // It's possible no items exist for the day, which is not necessarily an error.
      // However, logging the page content if nothing is found might be useful for initial setup.
      // const content = await page.content();
      // console.log(`Page content for ${dataUrl} (when no items found): \n ${content.substring(0, 2000)}`);
    } else {
      console.log(`Successfully scraped ${billItems.length} bill items.`);
    }

    return billItems;
  } catch (error) {
    console.error('Error during data scraping:', error);
    // Depending on the error, you might want to take a screenshot or save HTML for debugging
    // if (page) {
    //   await page.screenshot({ path: 'error_screenshot.png' });
    //   const errorHtml = await page.content();
    //   // fs.writeFileSync('error_page.html', errorHtml); // Requires fs module
    // }
    throw new Error(`Failed to scrape data: ${error instanceof Error ? error.message : String(error)}`);
  }
}
