import React from "react";
import { FilterBar } from "./FilterBar";
import { DiagramsTable } from "./DiagramsTable";
import { Pagination } from "./Pagination";
import { useDiagrams } from "@/hooks/useDiagrams";

export default function DiagramsPanel() {
  const { diagrams, pagination, tableState, isLoading, error, setFilter, setSort, setPage, selectDiagram } =
    useDiagrams();

  return (
    <div className="p-4 space-y-4">
      <FilterBar value={tableState.filter} onChange={setFilter} />
      <DiagramsTable diagrams={diagrams} isLoading={isLoading} onSort={setSort} onSelect={selectDiagram} />
      <Pagination {...pagination} onChange={setPage} />
      {error && <div className="text-red-500 text-sm">{error}</div>}
    </div>
  );
}
