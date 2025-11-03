import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/login-page";
import { AppPage } from "../pages/app-page";

test.describe("Complete Login Journey", () => {
  let loginPage: LoginPage;
  let appPage: AppPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    appPage = new AppPage(page);
  });

  test("user can complete full login journey", async ({ page }) => {
    // Arrange
    const testUser = {
      email: "michal.kozlik@wavestone.com",
      password: "B5HHgd5_VeXGFDi",
    };

    // Act & Assert - Step 1: Open login page
    await loginPage.navigateToLogin();
    await expect(loginPage.loginPageContainer).toBeVisible();
    await expect(page).toHaveURL("/login");

    // Act & Assert - Step 2: Fill in credentials
    await loginPage.fillEmail(testUser.email);
    await loginPage.fillPassword(testUser.password);

    // Verify fields are filled
    await expect(loginPage.emailInput).toHaveValue(testUser.email);
    await expect(loginPage.passwordInput).toHaveValue(testUser.password);

    // Act & Assert - Step 3: Click login button
    await loginPage.clickSubmit();

    // Verify button shows loading state
    await expect(loginPage.submitButton).toHaveText(/Logowanie.../);

    // Act & Assert - Step 4: Wait for redirect to dashboard
    await loginPage.waitForSuccessfulLogin("/app");
    await expect(page).toHaveURL("/app");

    // Verify dashboard is loaded
    await appPage.waitForDashboard();
    await expect(appPage.dashboard).toBeVisible();
    await expect(appPage.diagramsPanelContainer).toBeVisible();
    await expect(appPage.editorPanelContainer).toBeVisible();
  });

  test("user journey with remember me unchecked", async ({ page }) => {
    // Arrange
    const testUser = {
      email: "michal.kozlik@wavestone.com",
      password: "B5HHgd5_VeXGFDi",
    };

    // Act
    await loginPage.navigateToLogin();
    await loginPage.fillEmail(testUser.email);
    await loginPage.fillPassword(testUser.password);
    await loginPage.setRememberMe(false);
    await loginPage.clickSubmit();

    // Assert
    await expect(page).toHaveURL("/app");
    await expect(appPage.dashboard).toBeVisible();
  });

  test("user journey with next parameter", async ({ page }) => {
    // Arrange
    const testUser = {
      email: "michal.kozlik@wavestone.com",
      password: "B5HHgd5_VeXGFDi",
    };
    const nextPath = "/app";

    // Act
    await loginPage.navigateToLoginWithNext(nextPath);
    await loginPage.login(testUser.email, testUser.password);

    // Assert
    await expect(page).toHaveURL(nextPath);
    await expect(appPage.dashboard).toBeVisible();
  });

  test("failed login shows error and allows retry", async ({ page }) => {
    // Arrange
    const invalidUser = {
      email: "invalid@example.com",
      password: "WrongPass123",
    };
    const validUser = {
      email: "michal.kozlik@wavestone.com",
      password: "B5HHgd5_VeXGFDi",
    };

    // Act - First attempt with invalid credentials
    await loginPage.navigateToLogin();
    await loginPage.login(invalidUser.email, invalidUser.password);

    // Assert - Error is shown
    await expect(loginPage.serverError).toBeVisible();
    await expect(page).toHaveURL("/login");

    // Act - Retry with valid credentials
    await loginPage.fillEmail(validUser.email);
    await loginPage.fillPassword(validUser.password);
    await loginPage.clickSubmit();

    // Assert - Successfully logged in
    await expect(page).toHaveURL("/app");
    await expect(appPage.dashboard).toBeVisible();
  });

  test("user can navigate between login and register", async ({ page }) => {
    // Arrange
    await loginPage.navigateToLogin();

    // Act - Go to register
    await loginPage.clickRegisterLink();

    // Assert
    await expect(page).toHaveURL("/register");

    // Act - Go back to login
    await page.goBack();

    // Assert
    await expect(page).toHaveURL("/login");
    await expect(loginPage.loginPageContainer).toBeVisible();
  });

  test("user can navigate to forgot password from login", async ({ page }) => {
    // Arrange
    await loginPage.navigateToLogin();

    // Act
    await loginPage.clickForgotPassword();

    // Assert
    await expect(page).toHaveURL("/reset-password");

    // Act - Go back
    await page.goBack();

    // Assert
    await expect(page).toHaveURL("/login");
  });
});
