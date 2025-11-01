import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ValidationHints } from "./ValidationHints";

describe("ValidationHints", () => {
  it("renders nothing when errors is empty", () => {
    const { container } = render(<ValidationHints errors={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders all error messages when provided", () => {
    render(<ValidationHints errors={["E1", "E2"]} />);
    expect(screen.getByText("E1")).toBeVisible();
    expect(screen.getByText("E2")).toBeVisible();
  });
});
