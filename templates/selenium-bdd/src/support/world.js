import { setWorldConstructor, After } from '@cucumber/cucumber';

class CustomWorld {
  constructor() {
    this.browser = null;
  }
}

setWorldConstructor(CustomWorld);

After(async function () {
  if (this.browser) {
    await this.browser.close();
  }
});
