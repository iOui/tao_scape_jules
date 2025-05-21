# Anousith Express Web Scraper

## Description

This project is a Next.js application designed to automate the process of logging into `app.anousith-express.com`, scraping daily bill data, storing this data in a PostgreSQL database, and running these operations on a predefined schedule.

## Prerequisites

Before you begin, ensure you have the following installed and configured:

*   **Node.js**: Version 18 or later is recommended.
*   **npm** (comes with Node.js) or **yarn**.
*   **PostgreSQL Server**: A running instance of PostgreSQL.
*   **Website Access**: Valid login credentials for `https://app.anousith-express.com`.

## Setup and Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    ```
    (Replace `<repository-url>` with the actual URL of this repository)

2.  **Navigate to the project directory**:
    ```bash
    cd <project-directory>
    ```
    (Replace `<project-directory>` with the name of the cloned folder)

3.  **Install dependencies**:
    ```bash
    npm install
    ```
    or if you use yarn:
    ```bash
    yarn install
    ```

4.  **Set up environment variables**:
    *   Copy the example environment file to a new `.env` file:
        ```bash
        cp .env.example .env
        ```
    *   Open the `.env` file and update it with your specific configurations. The variables are:
        *   `LOGIN_USERNAME`: Your username for `app.anousith-express.com`.
        *   `LOGIN_PASSWORD`: Your password for `app.anousith-express.com`.
        *   `DB_HOST`: The hostname or IP address of your PostgreSQL server (e.g., `localhost`).
        *   `DB_PORT`: The port number for your PostgreSQL server (e.g., `5432`).
        *   `DB_USER`: Your PostgreSQL username.
        *   `DB_PASSWORD`: Your PostgreSQL password.
        *   `DB_NAME`: The name of the PostgreSQL database to use.
        *   `NEXT_PUBLIC_APP_URL`: The base URL of this application, used by the scheduler for API calls. Defaults to `http://localhost:3000` if not set.

## Database Setup

The application is designed to automatically create the necessary table (`raw_bill_data`) in your PostgreSQL database when the scraping process is first triggered (either manually via the API endpoint or by a scheduled task).

For reference, the schema of the `raw_bill_data` table is as follows:

| Column         | Type                        | Constraints / Default                      |
|----------------|-----------------------------|--------------------------------------------|
| `id`           | `SERIAL`                    | `PRIMARY KEY`                              |
| `billId`       | `TEXT`                      |                                            |
| `trackingId`   | `TEXT`                      |                                            |
| `customerName` | `TEXT`                      |                                            |
| `phone`        | `TEXT`                      |                                            |
| `address`      | `TEXT`                      |                                            |
| `productDetails`| `TEXT`                     |                                            |
| `codAmount`    | `NUMERIC`                   |                                            |
| `status`       | `TEXT`                      |                                            |
| `scrapedAt`    | `TIMESTAMP WITH TIME ZONE`  | `DEFAULT CURRENT_TIMESTAMP`                |
| `scrapedDate`  | `DATE`                      | `DEFAULT CURRENT_DATE`                     |

## Running the Application

To run the application in development mode:

```bash
npm run dev
```
or with yarn:
```bash
yarn dev
```
This will start the Next.js development server, typically on `http://localhost:3000`. The scheduler will also be initialized and start running according to its defined cron jobs.

## Triggering Scraping Manually

You can trigger the scraping process manually by sending a POST request to the `/api/scrape` endpoint.

Using `curl`:
```bash
curl -X POST http://localhost:3000/api/scrape
```
You can also use tools like Postman or Insomnia to send a POST request to `http://localhost:3000/api/scrape`.

## Scheduled Tasks

The scraping process is scheduled to run automatically at the following times (Asia/Vientiane timezone):

*   **17:10** (5:10 PM)
*   **18:30** (6:30 PM)
*   **19:50** (7:50 PM)

These schedules are defined in `lib/scheduler.ts` and managed by `node-cron`.

## Project Structure

Here's a brief overview of key files and directories:

*   `app/api/scrape/route.ts`: Contains the Next.js API route that handles POST requests to trigger the scraping process.
*   `lib/login.ts`: Module responsible for logging into `app.anousith-express.com` using Puppeteer.
*   `lib/scraper.ts`: Module responsible for navigating to the data page and extracting bill information using Puppeteer.
*   `lib/database.ts`: Module for all PostgreSQL database interactions, including table creation and data insertion.
*   `lib/scheduler.ts`: Configures and initializes the `node-cron` scheduled tasks.
*   `instrumentation.ts`: Next.js instrumentation hook file, used here to initialize the scheduler on server startup.
*   `.env.example`: Template for environment variable configuration.
*   `next.config.mjs`: Next.js configuration file, enables the instrumentation hook.

## Troubleshooting/Notes

*   **Chromium Download**: Puppeteer requires a Chromium browser. If it doesn't find a suitable local installation, it may download one. This can take some time on the first run.
*   **Check Logs**: If you encounter issues, especially with scraping or scheduled tasks, check the console output of the Next.js application for error messages and logs.
*   **Website Structure Changes**: The web scraper relies on specific HTML selectors (defined in `lib/scraper.ts`) to find and extract data. If the structure of `app.anousith-express.com` changes, these selectors may need to be updated. The current selectors are based on common web patterns and assumptions.
*   **Environment Variables**: Ensure all required environment variables in `.env` are correctly set up before running the application. Missing or incorrect credentials or database details are common sources of errors.

---
This README provides a comprehensive guide to setting up, running, and understanding the Anousith Express Web Scraper project.
