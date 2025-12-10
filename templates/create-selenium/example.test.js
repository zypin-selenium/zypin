import { createDriver, By } from '@zypin-selenium/selenium';

const driver = await createDriver();

try {
  await driver.get('https://www.google.com');

  const searchBox = await driver.findElement(By.name('q'));
  await searchBox.sendKeys('Selenium WebDriver');
  await searchBox.submit();

  await driver.sleep(2000);
  const title = await driver.getTitle();

  if (!title.includes('Selenium WebDriver')) throw new Error('search failed');
  console.log('✓ test passed');
} catch (error) {
  console.error('✗ failed,', error.message);
} finally {
  await driver.quit();
}
