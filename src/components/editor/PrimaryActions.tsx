import { Button } from "../ui/button";

interface PrimaryActionsProps {
  canSave: boolean;
  canSolve: boolean;
  isSaveEnabled: boolean;
  onSave: () => void;
  onSolve: () => void;
  onClear: () => void;
  onExample: () => void;
}

export function PrimaryActions({
  canSave,
  canSolve,
  isSaveEnabled,
  onSave,
  onSolve,
  onClear,
  onExample,
}: PrimaryActionsProps) {
  return (
    <div className="flex justify-between gap-2">
      <div className="space-x-2">
        <Button variant="outline" onClick={onClear}>
          Czyść
        </Button>
        <Button variant="outline" onClick={onExample}>
          Przykład
        </Button>
      </div>
      <div className="space-x-2">
        <Button variant="secondary" onClick={onSolve} disabled={!canSolve}>
          Rozwiąż
        </Button>
        <Button onClick={onSave} disabled={!canSave || !isSaveEnabled}>
          Zapisz
        </Button>
      </div>
    </div>
  );
}
