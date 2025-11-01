import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserMenu } from "@/components/UserMenu";

describe("UserMenu", () => {
  it("should render user email and logout button", () => {
    const userEmail = "test@example.com";
    render(<UserMenu userEmail={userEmail} />);

    expect(screen.getByText(userEmail)).toBeInTheDocument();
    expect(screen.getByText("Wyloguj")).toBeInTheDocument();
  });
});
