import type { DiagramDTO } from "../types";

export const Events = {
  DIAGRAM_SELECT: "diagramSelect",
  DIAGRAM_UPDATE: "diagramUpdate",
  DIAGRAM_DELETE: "diagramDelete",
  SUDOKU_VALIDATION: "sudokuValidation",
} as const;

export interface EventTypes {
  [Events.DIAGRAM_SELECT]: DiagramDTO;
  [Events.DIAGRAM_UPDATE]: void;
  [Events.DIAGRAM_DELETE]: void;
  [Events.SUDOKU_VALIDATION]: string[];
}

export function dispatchGlobalEvent<K extends keyof EventTypes>(event: K, detail: EventTypes[K]): void {
  window.dispatchEvent(
    new CustomEvent(event, {
      detail,
    })
  );
}

export function addGlobalEventListener<K extends keyof EventTypes>(
  event: K,
  listener: (detail: EventTypes[K]) => void
): () => void {
  const eventListener = ((e: CustomEvent<EventTypes[K]>) => {
    listener(e.detail);
  }) as EventListener;

  window.addEventListener(event, eventListener);
  return () => window.removeEventListener(event, eventListener);
}
