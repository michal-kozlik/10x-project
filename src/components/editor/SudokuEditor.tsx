import type { DiagramDTO } from "../../types";
import { SudokuTextarea } from "./SudokuTextarea";
import { ValidationHints } from "./ValidationHints";
import { PrimaryActions } from "./PrimaryActions";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { useState, useCallback } from "react";

interface SudokuEditorProps {
  diagram: DiagramDTO | null;
  isDirty: boolean;
  validationErrors: string[];
  onSave: (data: { name: string; definition: string }) => void;
  onSolve: (id: number) => void;
  onClear: () => void;
}

export function SudokuEditor({ diagram, isDirty, validationErrors, onSave, onSolve, onClear }: SudokuEditorProps) {
  const [name, setName] = useState(diagram?.name ?? "");
  const [definition, setDefinition] = useState(diagram?.definition ?? "");

  const handleSave = useCallback(() => {
    onSave({ name, definition });
  }, [name, definition, onSave]);

  const handleSolve = useCallback(() => {
    if (diagram?.id) {
      onSolve(diagram.id);
    }
  }, [diagram, onSolve]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{diagram ? "Edit Diagram" : "Create New Diagram"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter diagram name" />
        </div>

        <div className="space-y-2">
          <label htmlFor="definition" className="text-sm font-medium">
            Definition
          </label>
          <SudokuTextarea id="definition" value={definition} onChange={setDefinition} />
          <ValidationHints errors={validationErrors} />
        </div>

        <PrimaryActions
          canSave={!validationErrors.length && name.trim().length > 0}
          canSolve={!validationErrors.length && diagram?.id !== undefined}
          onSave={handleSave}
          onSolve={handleSolve}
          onClear={onClear}
          isSaveEnabled={isDirty}
        />
      </CardContent>
    </Card>
  );
}
