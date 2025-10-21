import { useCallback, useEffect, useState } from "react";
import { Textarea } from "../ui/textarea";

interface SudokuTextareaProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
}

const stringToGrid = (str: string): string => {
  return Array.from({ length: 9 }, (_, i) => str.slice(i * 9, (i + 1) * 9)).join("\n");
};

const gridToString = (grid: string): string => {
  return grid.replace(/\n/g, "");
};

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function SudokuTextarea({ id, value, onChange }: SudokuTextareaProps) {
  const [gridValue, setGridValue] = useState(() => stringToGrid(value));
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    errors: [],
  });

  const validateSudoku = useCallback((definition: string): ValidationResult => {
    const errors: string[] = [];

    // Check format and length
    const cleanDefinition = definition.replace(/[^\d.]/g, "");
    if (cleanDefinition.length !== 81) {
      errors.push("Definition must be exactly 81 characters long");
    }

    if (!/^[1-9.]*$/.test(definition)) {
      errors.push("Only digits 1-9 and dots (.) are allowed");
    }

    // If basic format is invalid, don't perform further validation
    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Convert definition to 9x9 grid
    const grid: (string | null)[][] = [];
    for (let i = 0; i < 9; i++) {
      grid[i] = [];
      for (let j = 0; j < 9; j++) {
        const char = definition[i * 9 + j];
        grid[i][j] = char === "." ? null : char;
      }
    }

    // Check rows
    for (let row = 0; row < 9; row++) {
      const seen = new Set<string>();
      for (let col = 0; col < 9; col++) {
        const value = grid[row][col];
        if (value && seen.has(value)) {
          errors.push(`Duplicate number ${value} in row ${row + 1}`);
          break;
        }
        if (value) seen.add(value);
      }
    }

    // Check columns
    for (let col = 0; col < 9; col++) {
      const seen = new Set<string>();
      for (let row = 0; row < 9; row++) {
        const value = grid[row][col];
        if (value && seen.has(value)) {
          errors.push(`Duplicate number ${value} in column ${col + 1}`);
          break;
        }
        if (value) seen.add(value);
      }
    }

    // Check 3x3 boxes
    for (let box = 0; box < 9; box++) {
      const seen = new Set<string>();
      const boxRow = Math.floor(box / 3) * 3;
      const boxCol = (box % 3) * 3;

      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const value = grid[boxRow + i][boxCol + j];
          if (value && seen.has(value)) {
            errors.push(`Duplicate number ${value} in box ${Math.floor(boxRow / 3) * 3 + Math.floor(boxCol / 3) + 1}`);
            break;
          }
          if (value) seen.add(value);
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }, []);

  useEffect(() => {
    const result = validateSudoku(gridValue);
    setValidationResult(result);
    // Custom event for validation result
    window.dispatchEvent(
      new CustomEvent("sudokuValidation", {
        detail: result.errors,
      })
    );
  }, [gridValue, validateSudoku]);

  // Update grid when external value changes
  useEffect(() => {
    setGridValue(stringToGrid(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newGridValue = e.target.value;
    setGridValue(newGridValue);
    onChange(gridToString(newGridValue));
  };

  return (
    <Textarea
      id={id}
      value={gridValue}
      onChange={handleChange}
      className="font-mono"
      rows={9}
      spellCheck={false}
      aria-invalid={!validationResult.isValid}
      aria-errormessage={validationResult.errors.join(". ")}
    />
  );
}
