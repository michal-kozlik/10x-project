import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "../../lib/utils";

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSort?: string;
  onClick: (sortKey: string) => void;
  className?: string;
}

export function SortableHeader({
  label,
  sortKey,
  currentSort = "",
  onClick,
  className = "",
}: SortableHeaderProps) {
  const isActive = currentSort?.replace(/^-/, "") === sortKey;
  const isDesc = currentSort?.startsWith("-") ?? false;

  return (
    <th
      onClick={() => onClick(isActive && !isDesc ? `-${sortKey}` : sortKey)}
      className={cn(
        "px-1 py-2 text-left cursor-pointer select-none",
        className,
        isActive && "font-semibold",
      )}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive && (
          <span className="ml-1">
            {isDesc ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </span>
        )}
      </div>
    </th>
  );
}
