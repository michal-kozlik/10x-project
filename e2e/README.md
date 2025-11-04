# E2E Testing - Page Object Model

## Overview

This directory contains Page Object Model (POM) classes for E2E testing with Playwright. The POM pattern helps maintain clean, reusable, and maintainable test code.

## Structure

```
e2e/
├── pages/                    # Page Object Model classes
│   ├── base-page.ts         # Base class for all pages
│   ├── login-page.ts        # Login page objects
│   ├── app-page.ts          # App dashboard page objects
│   └── home-page.ts         # Home page objects
└── tests/                   # Test files
    ├── login.spec.ts        # Login functionality tests
    ├── app.spec.ts          # App dashboard tests
    └── login-journey.spec.ts # Complete user journey tests
```

## Page Objects

### BasePage

Base class providing common functionality for all pages:

```typescript
class BasePage {
  async goto(path: string)
  async waitForLoad()
}
```

### LoginPage

Handles all interactions with the login page:

#### Locators
- `emailInput` - Email input field
- `passwordInput` - Password input field
- `rememberCheckbox` - "Remember me" checkbox
- `submitButton` - Submit button
- `forgotPasswordLink` - "Forgot password?" link
- `registerLink` - "Register" link
- `emailError` - Email validation error message
- `passwordError` - Password validation error message
- `serverError` - Server error message
- `loginCard` - Main login card
- `loginPageContainer` - Login page container

#### Methods

**Navigation:**
```typescript
await loginPage.navigateToLogin()
await loginPage.navigateToLoginWithNext('/app')
```

**Form Interactions:**
```typescript
await loginPage.fillEmail('user@example.com')
await loginPage.fillPassword('Password123')
await loginPage.setRememberMe(true)
await loginPage.clickSubmit()
```

**Complete Login:**
```typescript
await loginPage.login('user@example.com', 'Password123', true)
```

**Navigation Links:**
```typescript
await loginPage.clickForgotPassword()
await loginPage.clickRegisterLink()
```

**Validation Checks:**
```typescript
const hasError = await loginPage.isEmailErrorVisible()
const errorText = await loginPage.getEmailErrorText()
```

**State Checks:**
```typescript
const isDisabled = await loginPage.isSubmitButtonDisabled()
await loginPage.waitForSuccessfulLogin('/app')
```

### AppPage

Handles interactions with the main application dashboard:

#### Locators
- `dashboard` - Main dashboard container
- `diagramsPanelContainer` - Diagrams panel container
- `editorPanelContainer` - Editor panel container

#### Methods

**Navigation:**
```typescript
await appPage.navigateToApp()
```

**Visibility Checks:**
```typescript
const isDashboardVisible = await appPage.isDashboardVisible()
const isDiagramsVisible = await appPage.isDiagramsPanelVisible()
const isEditorVisible = await appPage.isEditorPanelVisible()
```

**Wait Functions:**
```typescript
await appPage.waitForDashboard()
await appPage.waitForAppPage()
```

## Usage Examples

### Basic Login Test

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/login-page";
import { AppPage } from "../pages/app-page";

test("user can login successfully", async ({ page }) => {
  // Arrange
  const loginPage = new LoginPage(page);
  const appPage = new AppPage(page);

  // Act
  await loginPage.navigateToLogin();
  await loginPage.login("test@example.com", "ValidPass123");

  // Assert
  await expect(page).toHaveURL("/app");
  await expect(appPage.dashboard).toBeVisible();
});
```

### Test with Validation Errors

```typescript
test("shows validation error for invalid email", async ({ page }) => {
  // Arrange
  const loginPage = new LoginPage(page);
  await loginPage.navigateToLogin();

  // Act
  await loginPage.fillEmail("invalid-email");
  await loginPage.fillPassword("ValidPass123");
  await loginPage.clickSubmit();

  // Assert
  await expect(loginPage.emailError).toBeVisible();
  const errorText = await loginPage.getEmailErrorText();
  expect(errorText).toContain("poprawny adres e-mail");
});
```

### Complete User Journey

```typescript
test("complete login journey", async ({ page }) => {
  // Arrange
  const loginPage = new LoginPage(page);
  const appPage = new AppPage(page);

  // Act & Assert - Step 1: Navigate to login
  await loginPage.navigateToLogin();
  await expect(loginPage.loginPageContainer).toBeVisible();

  // Act & Assert - Step 2: Fill credentials
  await loginPage.fillEmail("test@example.com");
  await loginPage.fillPassword("ValidPass123");
  await expect(loginPage.emailInput).toHaveValue("test@example.com");

  // Act & Assert - Step 3: Submit
  await loginPage.clickSubmit();
  await expect(loginPage.submitButton).toBeDisabled();

  // Act & Assert - Step 4: Verify redirect
  await expect(page).toHaveURL("/app");
  await appPage.waitForDashboard();
  await expect(appPage.dashboard).toBeVisible();
});
```

## Best Practices

1. **Use Page Objects for all interactions**: Never interact with page elements directly in tests
2. **Follow AAA Pattern**: Arrange, Act, Assert for clear test structure
3. **Use descriptive method names**: Methods should clearly describe the action
4. **Return Locators, not elements**: This allows for flexible assertions
5. **Keep tests independent**: Each test should be able to run in isolation
6. **Use meaningful test data**: Make test data representative of real scenarios
7. **Add waits in page objects**: Hide complexity of waiting in page object methods
8. **Use data-testid selectors**: Prefer `data-testid` attributes for stable selectors

## Test Data Conventions

### Valid Test User
```typescript
const validUser = {
  email: "test@example.com",
  password: "ValidPass123"
}
```

### Invalid Test User
```typescript
const invalidUser = {
  email: "invalid@example.com",
  password: "WrongPass123"
}
```

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run specific test file
npx playwright test e2e/tests/login.spec.ts

# Run in headed mode
npx playwright test --headed

# Run with debugging
npx playwright test --debug

# Generate report
npx playwright show-report
```

## Debugging

1. **Use Playwright Inspector**: `npx playwright test --debug`
2. **Check traces**: Tests generate traces on failure
3. **Use screenshots**: `await page.screenshot({ path: 'screenshot.png' })`
4. **Console logs**: Add `console.log()` in page objects for debugging

## Maintenance

When adding new features:

1. Add `data-testid` attributes to new elements
2. Create/update page object classes
3. Add new methods to encapsulate interactions
4. Write tests using the page objects
5. Update this documentation
