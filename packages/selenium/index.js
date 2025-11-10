import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import firefox from 'selenium-webdriver/firefox.js';
import edge from 'selenium-webdriver/edge.js';

export { createBrowser };

// Implementation

async function createBrowser(options = {}) {
  const {
    browser = 'chrome',
    serverUrl = process.env.SELENIUM_SERVER_URL || 'http://localhost:8444',
    headless = false,
    capabilities = {}
  } = options;

  const validBrowsers = ['chrome', 'firefox', 'edge', 'safari'];
  const browserLower = browser.toLowerCase();

  if (!validBrowsers.includes(browserLower)) {
    throw new Error(`Invalid browser: ${browser}. Valid options: ${validBrowsers.join(', ')}`);
  }

  let builder = new Builder()
    .usingServer(serverUrl)
    .forBrowser(browserLower);

  if (headless) {
    switch (browserLower) {
      case 'chrome':
        const chromeOptions = new chrome.Options();
        chromeOptions.addArguments('--headless=new');
        builder = builder.setChromeOptions(chromeOptions);
        break;

      case 'firefox':
        const firefoxOptions = new firefox.Options();
        firefoxOptions.addArguments('-headless');
        builder = builder.setFirefoxOptions(firefoxOptions);
        break;

      case 'edge':
        const edgeOptions = new edge.Options();
        edgeOptions.addArguments('--headless=new');
        builder = builder.setEdgeOptions(edgeOptions);
        break;

      case 'safari':
        console.warn('Safari does not support headless mode. Running in normal mode.');
        break;
    }
  }

  if (Object.keys(capabilities).length > 0) {
    builder = builder.withCapabilities(capabilities);
  }

  let driver;
  try {
    driver = await builder.build();
  } catch (error) {
    throw new Error(`Failed to create browser: ${error.message}`);
  }

  return {
    driver,
    async close() {
      if (driver) {
        await driver.quit();
        driver = null;
      }
    }
  };
}
