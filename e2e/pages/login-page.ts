import { type Page, type Locator } from "@playwright/test";
import { BasePage } from "./base-page";

export class LoginPage extends BasePage {
  // Locators for form elements
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly rememberCheckbox: Locator;
  readonly submitButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;

  // Locators for error messages
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly serverError: Locator;

  // Locators for page elements
  readonly loginCard: Locator;
  readonly loginPageContainer: Locator;

  constructor(page: Page) {
    super(page);

    // Form elements
    this.emailInput = page.getByTestId("login-email-input");
    this.passwordInput = page.getByTestId("login-password-input");
    this.rememberCheckbox = page.getByTestId("login-remember-checkbox");
    this.submitButton = page.getByTestId("login-submit-button");
    this.forgotPasswordLink = page.getByTestId("login-forgot-password-link");
    this.registerLink = page.getByTestId("login-register-link");

    // Error messages
    this.emailError = page.getByTestId("login-email-error");
    this.passwordError = page.getByTestId("login-password-error");
    this.serverError = page.getByTestId("login-server-error");

    // Page elements
    this.loginCard = page.getByTestId("login-card");
    this.loginPageContainer = page.getByTestId("login-page");
  }

  /**
   * Navigate to the login page
   */
  async navigateToLogin() {
    await this.goto("/login");
    await this.waitForLoad();
  }

  /**
   * Navigate to the login page with a next path parameter
   * @param nextPath - The path to redirect to after login
   */
  async navigateToLoginWithNext(nextPath: string) {
    await this.goto(`/login?next=${encodeURIComponent(nextPath)}`);
    await this.waitForLoad();
  }

  /**
   * Fill the email field
   * @param email - The email address to fill
   */
  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  /**
   * Fill the password field
   * @param password - The password to fill
   */
  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  /**
   * Toggle the "Remember me" checkbox
   * @param checked - Whether to check or uncheck the checkbox
   */
  async setRememberMe(checked: boolean) {
    if (checked) {
      await this.rememberCheckbox.check();
    } else {
      await this.rememberCheckbox.uncheck();
    }
  }

  /**
   * Click the submit button
   */
  async clickSubmit() {
    await this.submitButton.click();
  }

  /**
   * Click the "Forgot password?" link
   */
  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  /**
   * Click the "Register" link
   */
  async clickRegisterLink() {
    await this.registerLink.click();
  }

  /**
   * Perform a complete login action
   * @param email - The email address
   * @param password - The password
   * @param rememberMe - Whether to check "Remember me" (default: true)
   */
  async login(email: string, password: string, rememberMe: boolean = true) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.setRememberMe(rememberMe);
    await this.clickSubmit();
  }

  /**
   * Wait for the login page to be visible
   */
  async waitForLoginPage() {
    await this.loginPageContainer.waitFor({ state: "visible" });
  }

  /**
   * Check if email error is visible
   */
  async isEmailErrorVisible(): Promise<boolean> {
    return await this.emailError.isVisible();
  }

  /**
   * Check if password error is visible
   */
  async isPasswordErrorVisible(): Promise<boolean> {
    return await this.passwordError.isVisible();
  }

  /**
   * Check if server error is visible
   */
  async isServerErrorVisible(): Promise<boolean> {
    return await this.serverError.isVisible();
  }

  /**
   * Get the text of the email error message
   */
  async getEmailErrorText(): Promise<string> {
    return await this.emailError.textContent() || "";
  }

  /**
   * Get the text of the password error message
   */
  async getPasswordErrorText(): Promise<string> {
    return await this.passwordError.textContent() || "";
  }

  /**
   * Get the text of the server error message
   */
  async getServerErrorText(): Promise<string> {
    return await this.serverError.textContent() || "";
  }

  /**
   * Check if the submit button is disabled
   */
  async isSubmitButtonDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  /**
   * Wait for navigation after successful login
   * @param expectedUrl - The expected URL after login (default: /app)
   */
  async waitForSuccessfulLogin(expectedUrl: string = "/app") {
    await this.page.waitForURL(expectedUrl);
  }
}
