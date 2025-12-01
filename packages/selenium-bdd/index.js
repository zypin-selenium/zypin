import { Before, After, Given, When, Then } from '@cucumber/cucumber';
import { createDriver, quit, By, Key } from '@zypin-selenium/selenium';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const SCREENSHOT_DIR = './screenshots';

// Auto hooks
Before(async function() {
  this.driver = await createDriver();
});

After(async function() {
  await quit(this.driver);
});

// Navigation
Given('I navigate to {string}', async function(url) { await this.driver.get(url); });
Given('I visit {string}', async function(url) { await this.driver.get(url); });

// Click
When('I click {string}', async function(selector) { await this.driver.findElement(By.css(selector)).click(); });
When('I click on {string}', async function(selector) { await this.driver.findElement(By.css(selector)).click(); });

// Input
When('I type {string} into {string}', async function(text, selector) { await this.driver.findElement(By.css(selector)).sendKeys(text); });
When('I fill {string} with {string}', async function(selector, text) { await this.driver.findElement(By.css(selector)).sendKeys(text); });
When('I clear {string}', async function(selector) { await this.driver.findElement(By.css(selector)).clear(); });
When('I press Enter in {string}', async function(selector) { await this.driver.findElement(By.css(selector)).sendKeys(Key.RETURN); });

// Select
When('I select {string} from {string}', async function(option, selector) {
  const select = await this.driver.findElement(By.css(selector));
  await select.findElement(By.css(`option[value="${option}"]`)).click();
});

// Checkbox
When('I check {string}', async function(selector) {
  const el = await this.driver.findElement(By.css(selector));
  if (!await el.isSelected()) await el.click();
});

When('I uncheck {string}', async function(selector) {
  const el = await this.driver.findElement(By.css(selector));
  if (await el.isSelected()) await el.click();
});

// Radio
When('I select radio {string}', async function(selector) { await this.driver.findElement(By.css(selector)).click(); });

// Hover
When('I hover over {string}', async function(selector) {
  const el = await this.driver.findElement(By.css(selector));
  await this.driver.actions().move({ origin: el }).perform();
});

// Scroll
When('I scroll to {string}', async function(selector) {
  const el = await this.driver.findElement(By.css(selector));
  await this.driver.executeScript('arguments[0].scrollIntoView(true);', el);
});

When('I scroll to top', async function() {
  await this.driver.executeScript('window.scrollTo(0, 0);');
});

When('I scroll to bottom', async function() {
  await this.driver.executeScript('window.scrollTo(0, document.body.scrollHeight);');
});

// Assertions
Then('I should see {string}', async function(text) {
  const body = await this.driver.findElement(By.css('body')).getText();
  if (!body.includes(text)) throw new Error(`Expected to see "${text}" but not found`);
});

Then('{string} should be visible', async function(selector) {
  const el = await this.driver.findElement(By.css(selector));
  if (!await el.isDisplayed()) throw new Error(`Element "${selector}" is not visible`);
});

Then('{string} should not be visible', async function(selector) {
  const elements = await this.driver.findElements(By.css(selector));
  if (elements.length > 0 && await elements[0].isDisplayed()) throw new Error(`Element "${selector}" is visible`);
});

Then('{string} should contain {string}', async function(selector, text) {
  const el = await this.driver.findElement(By.css(selector));
  const actualText = await el.getText();
  if (!actualText.includes(text)) throw new Error(`Element "${selector}" does not contain "${text}"`);
});

Then('{string} should have value {string}', async function(selector, value) {
  const el = await this.driver.findElement(By.css(selector));
  const actualValue = await el.getAttribute('value');
  if (actualValue !== value) throw new Error(`Element "${selector}" has value "${actualValue}" but expected "${value}"`);
});

// Wait
When('I wait for {string}', async function(selector) {
  await this.driver.wait(async () => {
    const elements = await this.driver.findElements(By.css(selector));
    return elements.length > 0 && await elements[0].isDisplayed();
  }, 10000);
});

When('I wait {int} seconds', async function(seconds) {
  await new Promise(resolve => setTimeout(resolve, seconds * 1000));
});

When('I wait {int} second', async function(seconds) {
  await new Promise(resolve => setTimeout(resolve, seconds * 1000));
});

// Screenshot
When('I take a screenshot', async function() {
  if (!existsSync(SCREENSHOT_DIR)) mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const screenshot = await this.driver.takeScreenshot();
  const filename = `screenshot-${Date.now()}.png`;
  writeFileSync(join(SCREENSHOT_DIR, filename), screenshot, 'base64');
});

When('I take a screenshot named {string}', async function(name) {
  if (!existsSync(SCREENSHOT_DIR)) mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const screenshot = await this.driver.takeScreenshot();
  const filename = `${name}.png`;
  writeFileSync(join(SCREENSHOT_DIR, filename), screenshot, 'base64');
});

// Re-export for custom steps
export { By, Key } from '@zypin-selenium/selenium';
export { Given, When, Then, Before, After } from '@cucumber/cucumber';
