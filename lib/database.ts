import { Pool } from 'pg';
import { BillItem } from './scraper'; // Assuming BillItem is defined in scraper.ts

// 1. Create a PostgreSQL connection pool instance
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// 2. Export an asynchronous function `createTableIfNotExists`
export async function createTableIfNotExists(): Promise<void> {
  const client = await pool.connect();
  try {
    // The table schema corresponds to BillItem, plus a scrapedAt timestamp and an auto-incrementing ID.
    // Using billId as a primary key might be problematic if bill IDs are not unique across different scrape dates.
    // An auto-incrementing id as PRIMARY KEY is generally safer.
    // Adding a UNIQUE constraint on (billId, scrapedAt_date) could be a good way to prevent duplicate entries for the same bill on the same day.
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS raw_bill_data (
        id SERIAL PRIMARY KEY,
        billId TEXT,
        trackingId TEXT,
        customerName TEXT,
        phone TEXT,
        address TEXT,
        productDetails TEXT,
        codAmount NUMERIC, -- Using NUMERIC for currency
        status TEXT,
        scrapedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        scrapedDate DATE DEFAULT CURRENT_DATE -- To easily query by scrape date
        -- Consider adding a UNIQUE constraint, e.g., UNIQUE (billId, scrapedDate)
        -- if you want to prevent inserting the exact same billId for the same day.
      );
    `;
    await client.query(createTableQuery);
    console.log('Table "raw_bill_data" checked/created successfully.');
  } catch (error) {
    console.error('Error creating table "raw_bill_data":', error);
    throw error;
  } finally {
    client.release();
  }
}

// 3. Export an asynchronous function `insertBillData`
export async function insertBillData(billItems: BillItem[]): Promise<void> {
  if (!billItems || billItems.length === 0) {
    console.log('No bill data to insert.');
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // Start transaction

    // Using TEXT for all BillItem fields initially, convert codAmount to numeric
    // The table uses NUMERIC for codAmount, so ensure conversion.
    const insertQuery = `
      INSERT INTO raw_bill_data (
        billId, trackingId, customerName, phone, address, 
        productDetails, codAmount, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT DO NOTHING; 
      -- Example of ON CONFLICT: if you add a UNIQUE constraint on (billId, scrapedDate)
      -- ON CONFLICT (billId, scrapedDate) DO UPDATE SET
      --   customerName = EXCLUDED.customerName,
      --   phone = EXCLUDED.phone,
      --   address = EXCLUDED.address,
      --   productDetails = EXCLUDED.productDetails,
      --   codAmount = EXCLUDED.codAmount,
      --   status = EXCLUDED.status,
      --   scrapedAt = CURRENT_TIMESTAMP;
    `;

    let insertedRowCount = 0;
    for (const item of billItems) {
      const codAmountNumeric = item.codAmount ? parseFloat(item.codAmount.replace(/[^0-9.-]+/g,"")) : null;
      const result = await client.query(insertQuery, [
        item.billId,
        item.trackingId,
        item.customerName,
        item.phone,
        item.address,
        item.productDetails,
        codAmountNumeric, // Ensure this is a number or null
        item.status,
      ]);
      insertedRowCount += result.rowCount;
    }

    await client.query('COMMIT'); // Commit transaction
    console.log(`Successfully inserted ${insertedRowCount} rows into "raw_bill_data".`);
    if (insertedRowCount < billItems.length) {
        console.log(`${billItems.length - insertedRowCount} items were duplicates (based on UNIQUE constraint) and were ignored or updated.`);
    }

  } catch (error) {
    await client.query('ROLLBACK'); // Rollback transaction on error
    console.error('Error inserting bill data into "raw_bill_data":', error);
    throw error;
  } finally {
    client.release();
  }
}

// Optional: Function to close the pool (useful for graceful shutdown)
export async function closePool(): Promise<void> {
  console.log('Closing database connection pool...');
  await pool.end();
  console.log('Database connection pool closed.');
}

// Example of how BillItem might look in scraper.ts (for reference)
/*
export interface BillItem {
  billId: string | null;
  trackingId: string | null;
  customerName: string | null;
  phone: string | null;
  address: string | null;
  productDetails: string | null;
  codAmount: string | null; // Cash on Delivery amount, might be a string like "1,500 KIP"
  status: string | null;
}
*/
