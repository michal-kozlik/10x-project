import { type Page } from "@playwright/test";
import { BasePage } from "./base-page";

export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigateToHome() {
    await this.goto("/");
    await this.waitForLoad();
  }
}
