import { useState, useCallback, useEffect } from "react";
import type { DiagramDTO, ListDiagramsQuery, ListDiagramsResponseDTO } from "../types";
import { Events, dispatchGlobalEvent } from "../lib/events";
import { showToast } from "../lib/toast";

interface TableState {
  page: number;
  limit: number;
  sortBy: string;
  filter: string;
}

export function useDiagrams() {
  const [diagrams, setDiagrams] = useState<DiagramDTO[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [tableState, setTableState] = useState<TableState>({
    page: 1,
    limit: 10,
    sortBy: "created_at",
    filter: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDiagrams = useCallback(async (query: ListDiagramsQuery) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/diagrams?${new URLSearchParams(query as Record<string, string>)}`);

      if (!response.ok) {
        throw new Error("Failed to fetch diagrams");
      }

      const data: ListDiagramsResponseDTO = await response.json();
      setDiagrams(data.data);
      setPagination(data.pagination);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      showToast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiagrams(tableState);
  }, [fetchDiagrams, tableState]);

  const setFilter = useCallback((filter: string) => {
    setTableState((prev) => ({ ...prev, filter, page: 1 }));
  }, []);

  const setSort = useCallback((sortBy: string) => {
    setTableState((prev) => ({ ...prev, sortBy }));
  }, []);

  const setPage = useCallback((page: number) => {
    setTableState((prev) => ({ ...prev, page }));
  }, []);

  const selectDiagram = useCallback((diagram: DiagramDTO) => {
    dispatchGlobalEvent(Events.DIAGRAM_SELECT, diagram);
  }, []);

  return {
    diagrams,
    pagination,
    tableState,
    isLoading,
    error,
    setFilter,
    setSort,
    setPage,
    selectDiagram,
  };
}
