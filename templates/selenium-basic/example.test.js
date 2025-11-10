import { createBrowser } from '@zypin-selenium/selenium';
import assert from 'assert';

describe('Example Test Suite', function() {
  let browser;

  before(async function() {
    browser = await createBrowser({ browser: 'chrome' });
  });

  after(async function() {
    await browser.close();
  });

  it('should open Google and verify title', async function() {
    await browser.driver.get('https://www.google.com');
    const title = await browser.driver.getTitle();
    assert.ok(title.includes('Google'));
  });

  it('should navigate to example.com', async function() {
    await browser.driver.get('https://example.com');
    const title = await browser.driver.getTitle();
    assert.strictEqual(title, 'Example Domain');
  });
});
