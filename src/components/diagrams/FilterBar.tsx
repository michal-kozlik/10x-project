import { Input } from "../ui/input";
import { Search } from "lucide-react";

interface FilterBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function FilterBar({ value, onChange }: FilterBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Szukaj diagramów..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8"
      />
    </div>
  );
}
