import { Button } from "../ui/button";

interface PrimaryActionsProps {
  canSave: boolean;
  canSolve: boolean;
  isSaveEnabled: boolean;
  onSave: () => void;
  onSolve: () => void;
  onClear: () => void;
}

export function PrimaryActions({ canSave, canSolve, isSaveEnabled, onSave, onSolve, onClear }: PrimaryActionsProps) {
  return (
    <div className="flex justify-between gap-2">
      <div>
        <Button variant="outline" onClick={onClear}>
          Clear
        </Button>
      </div>
      <div className="space-x-2">
        <Button variant="secondary" onClick={onSolve} disabled={!canSolve}>
          Solve
        </Button>
        <Button onClick={onSave} disabled={!canSave || !isSaveEnabled}>
          Save
        </Button>
      </div>
    </div>
  );
}
