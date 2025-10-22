import { useState, useCallback, useEffect } from "react";
import type { DiagramDTO } from "../types";
import {
  Events,
  addGlobalEventListener,
  dispatchGlobalEvent,
} from "../lib/events";
import { showToast } from "../lib/toast";

type SetStateAction<T> = React.Dispatch<React.SetStateAction<T>>;

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
          "You have unsaved changes. Do you want to discard them?",
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
      if (!editorState.diagram) {
        setEditorState((prev) => ({
          ...prev,
          isDirty: definition !== "",
        }));
      } else {
        setEditorState((prev) => ({
          ...prev,
          isDirty:
            definition !== prev.diagram?.definition ||
            (name !== prev.diagram?.name && prev.diagram.name !== null),
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

      const loadingToastId = showToast.loading("Saving diagram...");
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
          throw new Error("Failed to save diagram");
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
        showToast.success("Diagram saved successfully!");
      } catch (error) {
        showToast.dismiss(loadingToastId);
        showToast.error(
          error instanceof Error ? error.message : "Failed to save diagram",
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

    const loadingToastId = showToast.loading("Solving diagram...");
    try {
      const response = await fetch(
        `/api/diagrams/${editorState.diagram.id}/solve`,
        { method: "POST" },
      );

      if (!response.ok) {
        throw new Error("Failed to solve diagram");
      }

      const solvedDiagram: DiagramDTO = await response.json();
      setEditorState((prev) => ({
        ...prev,
        diagram: solvedDiagram,
      }));
      showToast.dismiss(loadingToastId);
      showToast.success("Diagram solved successfully!");
    } catch (error) {
      console.error("Error solving diagram:", error);
      showToast.dismiss(loadingToastId);
      showToast.error(
        error instanceof Error ? error.message : "Failed to solve diagram",
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
