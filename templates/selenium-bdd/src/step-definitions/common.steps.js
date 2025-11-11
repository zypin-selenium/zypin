import { Given, When, Then } from '@cucumber/cucumber';
import { createBrowser } from '@zypin-selenium/selenium';
import assert from 'assert';
import { By } from 'selenium-webdriver';

// Browser management
Given('I open browser {string}', async function (browserName) {
  this.browser = await createBrowser({ browser: browserName });
});

Then('I close browser', async function () {
  await this.browser.close();
  this.browser = null;
});

// Navigation
When('I open {string}', async function (url) {
  await this.browser.driver.get(url);
});

When('I navigate to {string}', async function (url) {
  await this.browser.driver.get(url);
});

// Interactions
When('I click {string}', async function (selector) {
  const element = await this.browser.driver.findElement(By.css(selector));
  await element.click();
});

When('I type {string} into {string}', async function (text, selector) {
  const element = await this.browser.driver.findElement(By.css(selector));
  await element.sendKeys(text);
});

// Assertions
Then('I should see {string}', async function (text) {
  const bodyText = await this.browser.driver.findElement(By.tagName('body')).getText();
  assert.ok(bodyText.includes(text), `Expected to see "${text}" but got "${bodyText}"`);
});

Then('the page title should be {string}', async function (expectedTitle) {
  const title = await this.browser.driver.getTitle();
  assert.strictEqual(title, expectedTitle);
});
