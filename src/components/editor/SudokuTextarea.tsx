import { useEffect, useState, useRef } from "react";
import { Textarea } from "../ui/textarea";

interface SudokuTextareaProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
}

// Format the string into 9 lines when it has exactly 81 characters
const stringToGrid = (str: string): string => {
  return str.length === 81
    ? Array.from({ length: 9 }, (_, i) => str.slice(i * 9, (i + 1) * 9)).join(
        "\n",
      )
    : str;
};

// Transform grid (with newlines) to a single line string
const gridToString = (grid: string): string => grid.replace(/\n/g, "");

export function SudokuTextarea({ id, value, onChange }: SudokuTextareaProps) {
  // Initialize gridValue with formatted value from backend
  const [gridValue, setGridValue] = useState(() => stringToGrid(value));

  // Keep track of the last normalized value we emitted via onChange
  const lastEmittedValue = useRef(gridToString(value));

  // Update grid when external value changes from outside
  // (e.g., when loading a different diagram, not from our own onChange)
  useEffect(() => {
    const normalizedIncoming = gridToString(value);

    // Only update if value changed from an external source
    // (not just echoed back from our own onChange)
    if (normalizedIncoming !== lastEmittedValue.current) {
      setGridValue(stringToGrid(value));
      lastEmittedValue.current = normalizedIncoming;
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setGridValue(newValue);
    // Remove newlines when sending to backend
    const normalized = gridToString(newValue);
    lastEmittedValue.current = normalized;
    onChange(normalized);
  };

  return (
    <Textarea
      id={id}
      value={gridValue}
      onChange={handleChange}
      className="font-mono"
      rows={9}
      spellCheck={false}
    />
  );
}
