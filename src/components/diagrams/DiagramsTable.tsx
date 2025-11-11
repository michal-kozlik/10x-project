import { useState } from "react";
import type { DiagramDTO } from "../../types";
import { SortableHeader } from "./SortableHeader";
import { formatDate } from "../../lib/utils";
import { DeleteDiagramDialog } from "./DeleteDiagramDialog";

interface DiagramsTableProps {
  diagrams: DiagramDTO[];
  isLoading: boolean;
  onSort: (sortKey: string) => void;
  onSelect: (diagram: DiagramDTO) => void;
  onDelete: (id: number) => Promise<void>;
  sortBy: string;
}

export function DiagramsTable({
  diagrams,
  isLoading,
  onSort,
  onSelect,
  onDelete,
  sortBy,
}: DiagramsTableProps) {
  const [deletingIds, setDeletingIds] = useState<number[]>([]);

  const handleDelete = async (id: number) => {
    setDeletingIds((prev) => [...prev, id]);
    try {
      await onDelete(id);
    } finally {
      setDeletingIds((prev) => prev.filter((pid) => pid !== id));
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-4" role="status">
        Ładowanie...
      </div>
    );
  }

  if (diagrams.length === 0) {
    return (
      <div className="text-center py-4" role="status">
        Brak diagramów
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <SortableHeader
              label="Nazwa"
              sortKey="name"
              currentSort={sortBy}
              onClick={onSort}
              className="border-r"
            />
            <SortableHeader
              label="Utworzono"
              sortKey="created_at"
              currentSort={sortBy}
              onClick={onSort}
              className="border-r"
            />
            <SortableHeader
              label="Zaktualiz."
              sortKey="updated_at"
              currentSort={sortBy}
              onClick={onSort}
              className="border-r"
            />
            <SortableHeader
              label="Definicja"
              sortKey="definition"
              currentSort={sortBy}
              onClick={onSort}
              className="border-r"
            />
            <SortableHeader
              label="Status"
              sortKey="solution"
              currentSort={sortBy}
              onClick={onSort}
              className="border-r"
            />
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {diagrams.map((diagram) => (
            <tr
              key={diagram.id}
              onClick={() => onSelect(diagram)}
              className={`border-b ${
                deletingIds.includes(diagram.id)
                  ? "opacity-50 pointer-events-none"
                  : "hover:bg-muted/50 cursor-pointer"
              }`}
            >
              <td className="border-r px-1 py-2">{diagram.name}</td>
              <td className="border-r px-1 py-2">
                {formatDate(diagram.created_at)}
              </td>
              <td className="border-r px-1 py-2">
                {diagram.updated_at
                  ? formatDate(diagram.updated_at)
                  : formatDate(diagram.created_at)}
              </td>
              <td className="border-r px-1 py-2 font-mono whitespace-pre">
                {diagram.definition.slice(0, 27)}...
              </td>
              <td className="border-r px-1 py-2">
                {diagram.solution ? (
                  <span title="Rozwiązane" className="text-green-500">
                    ✓
                  </span>
                ) : (
                  <span title="Nierozwiązane" className="text-gray-400">
                    ○
                  </span>
                )}
              </td>
              <td className="px-1 py-2 w-10">
                <DeleteDiagramDialog
                  diagram={diagram}
                  onConfirm={handleDelete}
                  disabled={deletingIds.includes(diagram.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
