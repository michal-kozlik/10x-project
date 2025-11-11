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
        // Check if diagram has a valid ID to determine if it's a new or existing diagram
        const isNewDiagram = !editorState.diagram?.id;
        const url = isNewDiagram
          ? "/api/diagrams"
          : `/api/diagrams/${editorState.diagram?.id}`;
        const method = isNewDiagram ? "POST" : "PUT";

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

  const onExample = useCallback(() => {
    const exampleDefinition = ` 6 915 4 1 34 7 6  24       3 8  926  63       1    7 749   6 56    873435 76 219`;

    // Create a temporary diagram object to populate the form
    // Using id: undefined makes the save operation treat it as a new diagram (POST)
    const tempDiagram = {
      id: undefined,
      name: "Przykładowy diagram",
      definition: exampleDefinition,
      solution: null,
      created_at: new Date().toISOString(),
    } as unknown as DiagramDTO;

    setEditorState({
      diagram: tempDiagram,
      isDirty: true,
      validationErrors: [],
    });
  }, []);

  return {
    ...editorState,
    onSave,
    onSolve,
    onClear,
    onExample,
    updateContent,
  };
}
