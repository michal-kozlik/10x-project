import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/login-page";
import { AppPage } from "../pages/app-page";

test.describe("Login Flow", () => {
  let loginPage: LoginPage;
  let appPage: AppPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    appPage = new AppPage(page);
  });

  test("should display login page correctly", async () => {
    // Arrange & Act
    await loginPage.navigateToLogin();

    // Assert
    await expect(loginPage.loginPageContainer).toBeVisible();
    await expect(loginPage.loginCard).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test("should show validation errors for empty fields", async () => {
    // Arrange
    await loginPage.navigateToLogin();

    // Act
    await loginPage.clickSubmit();

    // Assert
    // Browser native validation should prevent submission
    await expect(loginPage.loginPageContainer).toBeVisible();
  });

  test("should show validation error for invalid email format", async () => {
    // Arrange
    await loginPage.navigateToLogin();

    // Act
    await loginPage.fillEmail("invalid-email");
    await loginPage.fillPassword("ValidPass123");
    await loginPage.clickSubmit();

    // Assert
    await expect(loginPage.emailError).toBeVisible();
  });

  test("should show validation error for short password", async () => {
    // Arrange
    await loginPage.navigateToLogin();

    // Act
    await loginPage.fillEmail("user@example.com");
    await loginPage.fillPassword("short");
    await loginPage.clickSubmit();

    // Assert
    await expect(loginPage.passwordError).toBeVisible();
  });

  test("should successfully login with valid credentials", async ({ page }) => {
    // Arrange
    await loginPage.navigateToLogin();
    const validEmail = "michal.kozlik@wavestone.com";
    const validPassword = "B5HHgd5_VeXGFDi";

    // Act
    await loginPage.login(validEmail, validPassword);

    // Assert
    await expect(page).toHaveURL("/app");
    await expect(appPage.dashboard).toBeVisible();
  });

  test("should redirect to next path after login", async ({ page }) => {
    // Arrange
    const nextPath = "/app";
    await loginPage.navigateToLoginWithNext(nextPath);
    const validEmail = "michal.kozlik@wavestone.com";
    const validPassword = "B5HHgd5_VeXGFDi";

    // Act
    await loginPage.login(validEmail, validPassword);

    // Assert
    await expect(page).toHaveURL(nextPath);
    await expect(appPage.dashboard).toBeVisible();
  });

  test("should show server error for invalid credentials", async () => {
    // Arrange
    await loginPage.navigateToLogin();
    const invalidEmail = "wrong@example.com";
    const invalidPassword = "WrongPass123";

    // Act
    await loginPage.login(invalidEmail, invalidPassword);

    // Assert
    await expect(loginPage.serverError).toBeVisible();
    const errorText = await loginPage.getServerErrorText();
    expect(errorText).toBeTruthy();
  });

  test("should navigate to forgot password page", async ({ page }) => {
    // Arrange
    await loginPage.navigateToLogin();

    // Act
    await loginPage.clickForgotPassword();

    // Assert
    await expect(page).toHaveURL("/reset-password");
  });

  test("should navigate to register page", async ({ page }) => {
    // Arrange
    await loginPage.navigateToLogin();

    // Act
    await loginPage.clickRegisterLink();

    // Assert
    await expect(page).toHaveURL("/register");
  });

  test("should toggle remember me checkbox", async () => {
    // Arrange
    await loginPage.navigateToLogin();

    // Act - checkbox should be checked by default
    await expect(loginPage.rememberCheckbox).toBeChecked();

    // Act - uncheck
    await loginPage.setRememberMe(false);

    // Assert
    await expect(loginPage.rememberCheckbox).not.toBeChecked();

    // Act - check again
    await loginPage.setRememberMe(true);

    // Assert
    await expect(loginPage.rememberCheckbox).toBeChecked();
  });

  test("should disable submit button while submitting", async () => {
    // Arrange
    await loginPage.navigateToLogin();
    const validEmail = "michal.kozlik@wavestone.com";
    const validPassword = "B5HHgd5_VeXGFDi";

    // Act
    await loginPage.fillEmail(validEmail);
    await loginPage.fillPassword(validPassword);

    // Start submission but don't wait for it to complete
    const submitPromise = loginPage.clickSubmit();

    // Assert - button should be disabled during submission
    await expect(loginPage.submitButton).toBeDisabled();

    // Wait for submission to complete
    await submitPromise;
  });
});
