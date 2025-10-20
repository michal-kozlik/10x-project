import React from "react";
import { SudokuEditor } from "./SudokuEditor";
import { SolvedDiagramView } from "./SolvedDiagramView";
import { useSudokuEditor } from "@/hooks/useSudokuEditor";

export default function EditorPanel() {
  const { diagram, isDirty, validationErrors, onSave, onSolve, onClear } = useSudokuEditor();

  return (
    <div className="p-4 space-y-4">
      <SudokuEditor
        diagram={diagram}
        isDirty={isDirty}
        validationErrors={validationErrors}
        onSave={onSave}
        onSolve={onSolve}
        onClear={onClear}
      />
      {diagram?.solution && <SolvedDiagramView solution={diagram.solution} />}
    </div>
  );
}
