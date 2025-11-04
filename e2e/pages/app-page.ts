import { type Page, type Locator } from "@playwright/test";
import { BasePage } from "./base-page";

export class AppPage extends BasePage {
  // Main dashboard locators
  readonly dashboard: Locator;
  readonly diagramsPanelContainer: Locator;
  readonly editorPanelContainer: Locator;

  constructor(page: Page) {
    super(page);

    this.dashboard = page.getByTestId("app-dashboard");
    this.diagramsPanelContainer = page.getByTestId("diagrams-panel-container");
    this.editorPanelContainer = page.getByTestId("editor-panel-container");
  }

  /**
   * Navigate to the app dashboard
   */
  async navigateToApp() {
    await this.goto("/app");
    await this.waitForLoad();
  }

  /**
   * Wait for the dashboard to be visible
   */
  async waitForDashboard() {
    await this.dashboard.waitFor({ state: "visible" });
  }

  /**
   * Check if the dashboard is visible
   */
  async isDashboardVisible(): Promise<boolean> {
    return await this.dashboard.isVisible();
  }

  /**
   * Check if the diagrams panel is visible
   */
  async isDiagramsPanelVisible(): Promise<boolean> {
    return await this.diagramsPanelContainer.isVisible();
  }

  /**
   * Check if the editor panel is visible
   */
  async isEditorPanelVisible(): Promise<boolean> {
    return await this.editorPanelContainer.isVisible();
  }

  /**
   * Wait for the app page to be fully loaded
   */
  async waitForAppPage() {
    await this.waitForDashboard();
    await this.diagramsPanelContainer.waitFor({ state: "visible" });
    await this.editorPanelContainer.waitFor({ state: "visible" });
  }
}
