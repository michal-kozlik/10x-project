/**
 * Validates a sudoku diagram definition according to US-004 requirements
 * @param definition - A string of 81 characters (digits 1-9 or spaces)
 * @returns Array of validation error messages, empty if valid
 */
export function validateSudokuDefinition(definition: string): string[] {
  const errors: string[] = [];

  // Check if definition is provided
  if (!definition || definition.trim() === "") {
    return errors; // Empty is valid (no errors for empty state)
  }

  // First check for invalid characters before normalization
  const withoutNewlines = definition.replace(/\n/g, "");
  const invalidChars = withoutNewlines
    .split("")
    .filter((ch) => ch !== " " && (ch < "1" || ch > "9"));
  if (invalidChars.length > 0) {
    errors.push(
      `Nieprawidłowe znaki w diagramie. Dozwolone są tylko cyfry 1-9 i spacje.`,
    );
    return errors;
  }

  // Normalize: remove newlines
  const normalized = definition.replace(/\n/g, "");

  // Check length - must be exactly 81 cells
  if (normalized.length !== 81) {
    errors.push(
      `Nieprawidłowy format – wprowadź dokładnie 81 znaków (9 wierszy po 9 znaków). Obecnie: ${normalized.length} znaków.`,
    );
    return errors; // Cannot continue validation if length is wrong
  }

  // Parse into a grid
  const grid: (number | null)[][] = [];
  for (let i = 0; i < 9; i++) {
    const row: (number | null)[] = [];
    for (let j = 0; j < 9; j++) {
      const char = normalized[i * 9 + j];
      row.push(char === " " ? null : parseInt(char, 10));
    }
    grid.push(row);
  }

  // Check for duplicates in rows
  for (let row = 0; row < 9; row++) {
    const seen = new Set<number>();
    const duplicates = new Set<number>();

    for (let col = 0; col < 9; col++) {
      const value = grid[row][col];
      if (value !== null) {
        if (seen.has(value)) {
          duplicates.add(value);
        }
        seen.add(value);
      }
    }

    if (duplicates.size > 0) {
      const dupList = Array.from(duplicates).join(", ");
      errors.push(`W wierszu ${row + 1} powtarza się cyfra: ${dupList}.`);
    }
  }

  // Check for duplicates in columns
  for (let col = 0; col < 9; col++) {
    const seen = new Set<number>();
    const duplicates = new Set<number>();

    for (let row = 0; row < 9; row++) {
      const value = grid[row][col];
      if (value !== null) {
        if (seen.has(value)) {
          duplicates.add(value);
        }
        seen.add(value);
      }
    }

    if (duplicates.size > 0) {
      const dupList = Array.from(duplicates).join(", ");
      errors.push(`W kolumnie ${col + 1} powtarza się cyfra: ${dupList}.`);
    }
  }

  // Check for duplicates in 3x3 boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const seen = new Set<number>();
      const duplicates = new Set<number>();

      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const row = boxRow * 3 + i;
          const col = boxCol * 3 + j;
          const value = grid[row][col];
          if (value !== null) {
            if (seen.has(value)) {
              duplicates.add(value);
            }
            seen.add(value);
          }
        }
      }

      if (duplicates.size > 0) {
        const dupList = Array.from(duplicates).join(", ");
        errors.push(
          `W bloku 3x3 (wiersz ${boxRow + 1}, kolumna ${boxCol + 1}) powtarza się cyfra: ${dupList}.`,
        );
      }
    }
  }

  return errors;
}
