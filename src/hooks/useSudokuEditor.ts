import { useState, useCallback, useEffect } from "react";
import type { DiagramDTO } from "../types";
import {
  Events,
  addGlobalEventListener,
  dispatchGlobalEvent,
} from "../lib/events";
import { showToast } from "../lib/toast";
import { validateSudokuDefinition } from "../lib/sudoku-validator";

interface EditorState {
  diagram: DiagramDTO | null;
  isDirty: boolean;
  validationErrors: string[];
}

export function useSudokuEditor() {
  const [editorState, setEditorState] = useState<EditorState>({
    diagram: null,
    isDirty: false,
    validationErrors: [],
  });

  useEffect(() => {
    const handleDiagramSelect = (diagram: DiagramDTO) => {
      if (editorState.isDirty) {
        const shouldDiscard = window.confirm(
          "Masz niezapisane zmiany. Czy chcesz je odrzucić?",
        );
        if (!shouldDiscard) {
          return;
        }
      }
      setEditorState((prev) => ({
        ...prev,
        diagram,
        isDirty: false,
        validationErrors: [],
      }));
    };

    return addGlobalEventListener(Events.DIAGRAM_SELECT, handleDiagramSelect);
  }, [editorState.isDirty]);

  const updateContent = useCallback(
    (name: string, definition: string) => {
      // Validate the definition
      const validationErrors = validateSudokuDefinition(definition);

      if (!editorState.diagram) {
        setEditorState((prev) => ({
          ...prev,
          isDirty: definition !== "",
          validationErrors,
        }));
      } else {
        setEditorState((prev) => ({
          ...prev,
          isDirty:
            definition !== prev.diagram?.definition ||
            (name !== prev.diagram?.name && prev.diagram.name !== null),
          validationErrors,
        }));
      }
    },
    [editorState.diagram],
  );

  const onSave = useCallback(
    async (data: { name: string; definition: string }) => {
      if (editorState.validationErrors.length > 0) {
        return;
      }

      const loadingToastId = showToast.loading("Zapisywanie diagramu...");
      try {
        const url = editorState.diagram
          ? `/api/diagrams/${editorState.diagram.id}`
          : "/api/diagrams";
        const method = editorState.diagram ? "PUT" : "POST";

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Nie udało się zapisać diagramu");
        }

        const savedDiagram: DiagramDTO = await response.json();
        setEditorState((prev) => ({
          ...prev,
          diagram: savedDiagram,
          isDirty: false,
        }));

        // Notify about the update
        dispatchGlobalEvent(Events.DIAGRAM_UPDATE, undefined);

        showToast.dismiss(loadingToastId);
        showToast.success("Diagram zapisany pomyślnie!");
      } catch (error) {
        showToast.dismiss(loadingToastId);
        showToast.error(
          error instanceof Error
            ? error.message
            : "Nie udało się zapisać diagramu",
        );
        throw error;
      }
    },
    [editorState.diagram, editorState.validationErrors],
  );

  const onSolve = useCallback(async () => {
    if (!editorState.diagram) {
      return;
    }

    const loadingToastId = showToast.loading("Rozwiązywanie diagramu...");
    try {
      const response = await fetch(
        `/api/diagrams/${editorState.diagram.id}/solve`,
        { method: "POST" },
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === "UNSOLVABLE") {
          throw new Error("Diagram jest nierozwiązywalny");
        }
        throw new Error("Nie udało się rozwiązać diagramu");
      }

      const solvedDiagram: DiagramDTO = await response.json();
      setEditorState((prev) => ({
        ...prev,
        diagram: solvedDiagram,
      }));
      showToast.dismiss(loadingToastId);
      showToast.success("Diagram rozwiązany pomyślnie!");
    } catch (error) {
      // Error solving diagram - show toast and re-throw
      showToast.dismiss(loadingToastId);
      showToast.error(
        error instanceof Error
          ? error.message
          : "Nie udało się rozwiązać diagramu",
      );
      throw error;
    }
  }, [editorState.diagram]);

  const onClear = useCallback(() => {
    setEditorState({
      diagram: null,
      isDirty: false,
      validationErrors: [],
    });
  }, []);

  return {
    ...editorState,
    onSave,
    onSolve,
    onClear,
    updateContent,
  };
}
