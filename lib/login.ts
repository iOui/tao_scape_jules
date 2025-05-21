import puppeteer, { Browser, Page } from 'puppeteer';

interface LoginResult {
  browser: Browser;
  page: Page;
}

export async function loginToApp(): Promise<LoginResult> {
  const username = process.env.LOGIN_USERNAME;
  const password = process.env.LOGIN_PASSWORD;

  if (!username || !password) {
    throw new Error('LOGIN_USERNAME and LOGIN_PASSWORD environment variables must be set.');
  }

  let browser: Browser | null = null;
  try {
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      headless: true, // Run in headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // Recommended for running in Docker/CI environments
    });
    console.log('Browser launched successfully.');

    const page = await browser.newPage();
    console.log('Navigating to login page...');
    await page.goto('https://app.anousith-express.com/login', { waitUntil: 'networkidle2' });
    console.log('Navigation to login page successful.');

    // Type username
    console.log('Typing username...');
    // Note: These selectors are assumptions and might need to be verified.
    const usernameSelector = 'input[name="username"]'; // Common selector for username
    await page.waitForSelector(usernameSelector, { visible: true });
    await page.type(usernameSelector, username);
    console.log('Username typed.');

    // Type password
    console.log('Typing password...');
    const passwordSelector = 'input[name="password"]'; // Common selector for password
    await page.waitForSelector(passwordSelector, { visible: true });
    await page.type(passwordSelector, password);
    console.log('Password typed.');

    // Click login button
    console.log('Clicking login button...');
    const loginButtonSelector = 'button[type="submit"]'; // Common selector for submit button
    await page.waitForSelector(loginButtonSelector, { visible: true });
    
    // Using Promise.all to click and wait for navigation simultaneously
    await Promise.all([
      page.click(loginButtonSelector),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);
    console.log('Login button clicked and navigation complete.');

    // At this point, login is assumed to be successful if no errors were thrown.
    // Further checks (e.g., for a specific element on the dashboard) could be added here.

    return { browser, page };
  } catch (error) {
    console.error('Error during login process:', error);
    if (browser) {
      await browser.close();
    }
    throw error; // Re-throw the error to be handled by the caller
  }
}
