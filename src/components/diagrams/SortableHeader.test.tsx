import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SortableHeader } from "./SortableHeader";

function renderInTable(ui: React.ReactNode) {
  return render(
    <table>
      <thead>
        <tr>{ui}</tr>
      </thead>
    </table>,
  );
}

describe("SortableHeader", () => {
  it("wywołuje onClick z poprawnym sortKey (inactive → asc)", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    renderInTable(
      <SortableHeader label="Nazwa" sortKey="name" currentSort="created_at" onClick={onClick} />,
    );

    const header = screen.getByRole("columnheader", { name: /nazwa/i });
    await user.click(header);

    expect(onClick).toHaveBeenCalledWith("name");
  });

  it("toggling: active asc → desc i active desc → asc", async () => {
    const user = userEvent.setup();

    // active asc
    const onClickAsc = vi.fn();
    const { container: c1 } = renderInTable(
      <SortableHeader label="Name" sortKey="name" currentSort="name" onClick={onClickAsc} />,
    );
    const headerAsc = within(c1).getByRole("columnheader", { name: /name/i });
    await user.click(headerAsc);
    expect(onClickAsc).toHaveBeenCalledWith("-name");

    // rerender for desc state
    const onClickDesc = vi.fn();
    const { container: c2 } = renderInTable(
      <SortableHeader label="Name" sortKey="name" currentSort="-name" onClick={onClickDesc} />,
    );
    const headerDesc = within(c2).getByRole("columnheader", { name: /name/i });
    await user.click(headerDesc);
    expect(onClickDesc).toHaveBeenCalledWith("name");
  });

  it("wyróżnia aktywny nagłówek (font-semibold) i pokazuje ikonę tylko gdy aktywny", async () => {
    const user = userEvent.setup();

    // inactive → brak pogrubienia i brak ikony
    const { container: c1 } = renderInTable(
      <SortableHeader label="Status" sortKey="solution" currentSort="created_at" onClick={vi.fn()} />,
    );
    const inactive = within(c1).getByRole("columnheader", { name: /status/i });
    expect(inactive).not.toHaveClass("font-semibold");
    expect(inactive.querySelector("svg")).toBeNull();

    // active asc → pogrubienie + ikona
    const { container: c2 } = renderInTable(
      <SortableHeader label="Status" sortKey="solution" currentSort="solution" onClick={vi.fn()} />,
    );
    const activeAsc = within(c2).getByRole("columnheader", { name: /status/i });
    expect(activeAsc).toHaveClass("font-semibold");
    expect(activeAsc.querySelector("svg")).not.toBeNull();

    // active desc → nadal pogrubienie + ikona
    const { container: c3 } = renderInTable(
      <SortableHeader label="Status" sortKey="solution" currentSort="-solution" onClick={vi.fn()} />,
    );
    const activeDesc = within(c3).getByRole("columnheader", { name: /status/i });
    expect(activeDesc).toHaveClass("font-semibold");
    expect(activeDesc.querySelector("svg")).not.toBeNull();

    // click still works in active states (sanity)
    await user.click(activeDesc);
  });
});
