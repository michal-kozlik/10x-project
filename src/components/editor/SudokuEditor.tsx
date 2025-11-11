import type { DiagramDTO } from "../../types";
import { SudokuTextarea } from "./SudokuTextarea";
import { ValidationHints } from "./ValidationHints";
import { PrimaryActions } from "./PrimaryActions";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { useState, useCallback, useEffect } from "react";

interface SudokuEditorProps {
  diagram: DiagramDTO | null;
  isDirty: boolean;
  validationErrors: string[];
  onSave: (data: { name: string; definition: string }) => void;
  onSolve: (id: number) => void;
  onClear: () => void;
  onExample: () => void;
  onContentChange?: (name: string, definition: string) => void;
}

export function SudokuEditor({
  diagram,
  isDirty,
  validationErrors,
  onSave,
  onSolve,
  onClear,
  onExample,
  onContentChange,
}: SudokuEditorProps) {
  const [name, setName] = useState(diagram?.name ?? "");
  const [definition, setDefinition] = useState(diagram?.definition ?? "");

  useEffect(() => {
    setName(diagram?.name ?? "");
    setDefinition(diagram?.definition ?? "");
  }, [diagram]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    onContentChange?.(newName, definition);
  };

  const handleDefinitionChange = (newDefinition: string) => {
    setDefinition(newDefinition);
    onContentChange?.(name, newDefinition);
  };

  const handleSave = useCallback(() => {
    onSave({ name: name.trim(), definition });
  }, [name, definition, onSave]);

  const handleSolve = useCallback(() => {
    if (diagram?.id) {
      onSolve(diagram.id);
    }
  }, [diagram, onSolve]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {diagram ? "Edytuj diagram" : "Utwórz nowy diagram"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Nazwa
          </label>
          <Input
            id="name"
            value={name}
            onChange={handleNameChange}
            placeholder="Wprowadź nazwę diagramu"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="definition" className="text-sm font-medium">
            Definicja (9x9)
          </label>
          <SudokuTextarea
            id="definition"
            value={definition}
            onChange={handleDefinitionChange}
          />
          <ValidationHints errors={validationErrors} />
        </div>

        <PrimaryActions
          canSave={!validationErrors.length}
          canSolve={!validationErrors.length && diagram?.id !== undefined}
          onSave={handleSave}
          onSolve={handleSolve}
          onClear={onClear}
          onExample={onExample}
          isSaveEnabled={isDirty}
        />
      </CardContent>
    </Card>
  );
}
