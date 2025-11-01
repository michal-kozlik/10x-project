import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/home-page";

test("home page shows welcome message", async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.navigateToHome();

  const welcomeMessage = await page.getByRole("heading", { level: 1 });
  await expect(welcomeMessage).toBeVisible();
});
