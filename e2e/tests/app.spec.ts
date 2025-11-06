import { test, expect } from "@playwright/test";
import { AppPage } from "../pages/app-page";
import { LoginPage } from "../pages/login-page";

test.describe("App Dashboard", () => {
  let appPage: AppPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    appPage = new AppPage(page);
    loginPage = new LoginPage(page);

    // Authenticate before each test
    const email = process.env.E2E_USERNAME || "";
    const password = process.env.E2E_PASSWORD || "";
    await loginPage.navigateToLogin();
    await loginPage.login(email, password);
    await page.waitForURL("/app");
  });

  test("should display dashboard after navigation", async () => {
    // Arrange & Act
    await appPage.navigateToApp();

    // Assert
    await expect(appPage.dashboard).toBeVisible();
    await expect(appPage.diagramsPanelContainer).toBeVisible();
    await expect(appPage.editorPanelContainer).toBeVisible();
  });

  test("should load all dashboard components", async () => {
    // Arrange
    await appPage.navigateToApp();

    // Act
    await appPage.waitForAppPage();

    // Assert
    const isDashboardVisible = await appPage.isDashboardVisible();
    const isDiagramsVisible = await appPage.isDiagramsPanelVisible();
    const isEditorVisible = await appPage.isEditorPanelVisible();

    expect(isDashboardVisible).toBe(true);
    expect(isDiagramsVisible).toBe(true);
    expect(isEditorVisible).toBe(true);
  });

  test("should have correct layout structure", async () => {
    // Arrange & Act
    await appPage.navigateToApp();
    await appPage.waitForAppPage();

    // Assert - check that panels are in the correct positions
    const diagramsBox = await appPage.diagramsPanelContainer.boundingBox();
    const editorBox = await appPage.editorPanelContainer.boundingBox();

    expect(diagramsBox).not.toBeNull();
    expect(editorBox).not.toBeNull();

    // Diagrams panel should be on the left (smaller x coordinate)
    if (diagramsBox && editorBox) {
      expect(diagramsBox.x).toBeLessThan(editorBox.x);
    }
  });
});
