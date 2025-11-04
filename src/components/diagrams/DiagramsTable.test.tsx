import { describe, it, expect, vi } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DiagramsTable } from "./DiagramsTable";
import type { DiagramDTO } from "../../types";

// Mock DeleteDiagramDialog to avoid Radix and focus on table logic
vi.mock("./DeleteDiagramDialog", () => ({
  DeleteDiagramDialog: ({ diagram, onConfirm, disabled }: any) => (
    <button
      aria-label={`mock-delete ${diagram.id}`}
      disabled={disabled}
      onClick={() => onConfirm(diagram.id)}
    >
      del
    </button>
  ),
}));

function makeDiagram(partial: Partial<DiagramDTO> = {}): DiagramDTO {
  return {
    id: partial.id ?? 1,
    name: partial.name ?? "Alpha",
    definition: partial.definition ?? "abc",
    solution: partial.solution ?? null,
    created_at:
      partial.created_at ?? new Date("2025-01-02T03:04:05Z").toISOString(),
    updated_at: partial.updated_at,
  };
}

describe("DiagramsTable", () => {
  it("pokazuje Loading... gdy isLoading=true", () => {
    render(
      <DiagramsTable
        diagrams={[]}
        isLoading={true}
        onSort={vi.fn()}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
        sortBy=""
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(/loading/i);
  });

  it("pokazuje komunikat pustej listy, gdy brak danych", () => {
    render(
      <DiagramsTable
        diagrams={[]}
        isLoading={false}
        onSort={vi.fn()}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
        sortBy=""
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(/no diagrams found/i);
  });

  it("wywołuje onSelect po kliknięciu wiersza oraz sortuje po kolumnie 'Utworzono'", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onSort = vi.fn();

    const diagram = makeDiagram({ id: 10, name: "Board" });

    render(
      <DiagramsTable
        diagrams={[diagram]}
        isLoading={false}
        onSort={onSort}
        onSelect={onSelect}
        onDelete={vi.fn()}
        sortBy=""
      />,
    );

    // sort by "Utworzono" -> created_at
    const createdHeader = screen.getByRole("columnheader", {
      name: /utworzono/i,
    });
    await user.click(createdHeader);
    expect(onSort).toHaveBeenCalledWith("created_at");

    // click row triggers onSelect(diagram)
    const row = screen.getByRole("row", { name: /board/i });
    await user.click(row);
    expect(onSelect).toHaveBeenCalledWith(diagram);
  });

  it("pokazuje fallback updated_at → created_at, gdy updated_at brak", () => {
    const withUpdated = makeDiagram({
      id: 1,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-03T00:00:00Z",
    });
    const withoutUpdated = makeDiagram({
      id: 2,
      created_at: "2025-01-02T00:00:00Z",
      updated_at: undefined,
    });

    render(
      <DiagramsTable
        diagrams={[withUpdated, withoutUpdated]}
        isLoading={false}
        onSort={vi.fn()}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
        sortBy=""
      />,
    );

    const rows = screen.getAllByRole("row");
    // skip header row, map data rows
    const dataRows = rows.slice(1);

    const row1 = within(dataRows[0]);
    const row2 = within(dataRows[1]);

    const created1 = row1.getAllByRole("cell")[1].textContent; // created_at
    const updated1 = row1.getAllByRole("cell")[2].textContent; // updated_at
    expect(created1 && updated1 && updated1.length > 0).toBeTruthy();
    expect(updated1).not.toEqual(created1); // ma updated_at, więc zwykle różne (chyba że format równa się przez przypadek)

    const created2 = row2.getAllByRole("cell")[1].textContent;
    const updated2 = row2.getAllByRole("cell")[2].textContent;
    expect(created2).toEqual(updated2); // fallback: gdy brak updated_at, pokazuje created_at
  });

  it("po kliknięciu mock-delete wywołuje onDelete i blokuje przycisk w trakcie operacji, odblokowuje po resolve", async () => {
    const user = userEvent.setup();
    let resolve!: () => void;
    const onDelete = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    const diagram = makeDiagram({ id: 99, name: "ToDelete" });

    render(
      <DiagramsTable
        diagrams={[diagram]}
        isLoading={false}
        onSort={vi.fn()}
        onSelect={vi.fn()}
        onDelete={onDelete}
        sortBy=""
      />,
    );

    const delBtn = screen.getByRole("button", { name: /mock-delete 99/i });
    await user.click(delBtn);
    expect(onDelete).toHaveBeenCalledWith(99);

    // while promise pending, button disabled due to deletingIds
    await waitFor(() => expect(delBtn).toBeDisabled());

    // resolve and expect enabled again
    resolve();
    await waitFor(() => expect(delBtn).not.toBeDisabled());
  });
});
