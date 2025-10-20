import type { DiagramDTO } from "../../types";
import { SortableHeader } from "./SortableHeader";
import { formatDate } from "../../lib/utils";

interface DiagramsTableProps {
  diagrams: DiagramDTO[];
  isLoading: boolean;
  onSort: (sortKey: string) => void;
  onSelect: (diagram: DiagramDTO) => void;
  sortBy: string;
}

export function DiagramsTable({ diagrams, isLoading, onSort, onSelect, sortBy }: DiagramsTableProps) {
  if (isLoading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (diagrams.length === 0) {
    return <div className="text-center py-4">No diagrams found</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <SortableHeader label="Name" sortKey="name" currentSort={sortBy} onClick={onSort} />
            <SortableHeader label="Created" sortKey="created_at" currentSort={sortBy} onClick={onSort} />
            <th className="px-4 py-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {diagrams.map((diagram) => (
            <tr
              key={diagram.id}
              onClick={() => onSelect(diagram)}
              className="border-b hover:bg-muted/50 cursor-pointer"
            >
              <td className="px-4 py-2">{diagram.name}</td>
              <td className="px-4 py-2">{formatDate(diagram.created_at)}</td>
              <td className="px-4 py-2">{diagram.solution ? "Solved" : "Unsolved"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
