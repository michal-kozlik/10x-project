import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteDiagramDialog } from "./DeleteDiagramDialog";
import type { DiagramDTO } from "../../types";

function makeDiagram(overrides: Partial<DiagramDTO> = {}): DiagramDTO {
  return {
    id: 1,
    name: "Test diagram",
    definition: "1,2,3",
    solution: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("DeleteDiagramDialog", () => {
  it("otwiera dialog po naciśnięciu klawisza Delete (gdy nie disabled) i zamyka po Cancel", async () => {
    const diagram = makeDiagram();
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    render(<DeleteDiagramDialog diagram={diagram} onConfirm={onConfirm} />);

    const trigger = screen.getByRole("button", {
      name: new RegExp(`delete diagram ${diagram.name}`, "i"),
    });

    // Open via keyboard (Delete key)
    fireEvent.keyDown(trigger, { key: "Delete" });

    // Dialog content visible
    expect(await screen.findByText(/delete diagram/i)).toBeInTheDocument();

    // Close via Cancel button
    const cancel = screen.getByRole("button", { name: /cancel deletion/i });
    await userEvent.click(cancel);

    await waitFor(() => {
      expect(screen.queryByText(/delete diagram/i)).not.toBeInTheDocument();
    });
  });

  it("potwierdzenie wywołuje onConfirm z id i zamyka dialog; w trakcie nie wywołuje kolejnych akcji", async () => {
    const diagram = makeDiagram({ id: 42, name: "Board" });

    let resolve!: () => void;
    const onConfirm = vi.fn(() => new Promise<void>((r) => (resolve = r)));

    render(<DeleteDiagramDialog diagram={diagram} onConfirm={onConfirm} />);

    const trigger = screen.getByRole("button", {
      name: new RegExp(`delete diagram ${diagram.name}`, "i"),
    });

    // Open by click
    await userEvent.click(trigger);

    const confirm = await screen.findByRole("button", {
      name: new RegExp(`confirm deletion of diagram ${diagram.name}`, "i"),
    });

    await userEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith(42);

    // Radix AlertDialogAction domyślnie zamyka okno po kliknięciu,
    // więc w trakcie trwającej operacji treść dialogu znika.
    await waitFor(() => {
      expect(screen.queryByText(/delete diagram/i)).not.toBeInTheDocument();
    });

    // Nawet jeśli operacja jeszcze trwa, kolejne kliknięcia w confirm nie powinny
    // powodować nowych wywołań (komponent chroni się przez isDeleting)
    // (symulujemy dodatkowy klik – nie zadziała, bo dialog zamknięty)
    await userEvent.click(trigger);
    const confirmAgain = await screen.findByRole("button", {
      name: new RegExp(`confirm deletion of diagram ${diagram.name}`, "i"),
    });
    await userEvent.click(confirmAgain);
    // Ponowne potwierdzenie podczas trwania poprzedniej operacji jest zablokowane
    expect(onConfirm).toHaveBeenCalledTimes(1);

    // Finiszujemy pierwszą obietnicę, żeby nie zostawiać wiszących tasków
    resolve();
  });

  it("nie otwiera dialogu klawiszem Delete, gdy disabled=true", async () => {
    const diagram = makeDiagram({ name: "Locked" });
    const onConfirm = vi.fn();

    render(
      <DeleteDiagramDialog diagram={diagram} onConfirm={onConfirm} disabled />,
    );

    const trigger = screen.getByRole("button", {
      name: new RegExp(`delete diagram ${diagram.name}`, "i"),
    });
    expect(trigger).toBeDisabled();

    fireEvent.keyDown(trigger, { key: "Delete" });

    // Should not open
    await waitFor(() => {
      expect(screen.queryByText(/delete diagram/i)).not.toBeInTheDocument();
    });
  });

  it("chroni przed wielokrotnym potwierdzeniem (blokada re-kliknięcia w trakcie)", async () => {
    const diagram = makeDiagram({ id: 7, name: "Matrix" });

    let resolve!: () => void;
    const onConfirm = vi.fn(() => new Promise<void>((r) => (resolve = r)));

    render(<DeleteDiagramDialog diagram={diagram} onConfirm={onConfirm} />);

    const trigger = screen.getByRole("button", {
      name: new RegExp(`delete diagram ${diagram.name}`, "i"),
    });
    await userEvent.click(trigger);

    const confirm = await screen.findByRole("button", {
      name: new RegExp(`confirm deletion of diagram ${diagram.name}`, "i"),
    });

    // Double click fast → tylko 1 wywołanie
    await Promise.all([userEvent.click(confirm), userEvent.click(confirm)]);
    expect(onConfirm).toHaveBeenCalledTimes(1);

    // Finish
    resolve();
    await waitFor(() =>
      expect(screen.queryByText(/delete diagram/i)).not.toBeInTheDocument(),
    );
  });
});
