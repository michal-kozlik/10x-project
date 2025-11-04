import { type Page } from "@playwright/test";
import { BasePage } from "./base-page";

export class HomePage extends BasePage {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(page: Page) {
    super(page);
  }

  async navigateToHome() {
    await this.goto("/");
    await this.waitForLoad();
  }
}
