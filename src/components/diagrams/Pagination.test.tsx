import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("zwraca null (nic nie renderuje), gdy tylko 1 strona lub mniej", () => {
    const { container: c1 } = render(
      <Pagination page={1} limit={10} total={10} onChange={vi.fn()} />,
    );
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(
      <Pagination page={1} limit={10} total={0} onChange={vi.fn()} />,
    );
    expect(c2.firstChild).toBeNull();
  });

  it("renderuje label i obsługuje kliknięcia Previous/Next w środku zakresu", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<Pagination page={2} limit={10} total={35} onChange={onChange} />);

    expect(screen.getByText(/page 2 of 4/i)).toBeInTheDocument();

    const prev = screen.getByRole("button", { name: /previous/i });
    const next = screen.getByRole("button", { name: /next/i });

    expect(prev).not.toBeDisabled();
    expect(next).not.toBeDisabled();

    await user.click(prev);
    expect(onChange).toHaveBeenCalledWith(1);

    await user.click(next);
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("blokuje Previous na pierwszej stronie i Next na ostatniej", () => {
    const { rerender } = render(
      <Pagination page={1} limit={10} total={22} onChange={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).not.toBeDisabled();

    rerender(<Pagination page={3} limit={10} total={22} onChange={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /previous/i }),
    ).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });
});
