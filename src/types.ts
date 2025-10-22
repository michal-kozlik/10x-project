import type {
  Database,
  Tables as _Tables,
  TablesInsert as _TablesInsert,
  TablesUpdate as _TablesUpdate,
} from "./db/database.types";

// Base entity helpers derived from Supabase generated types
export type DiagramEntity = _Tables<"diagrams">;
export type DiagramInsertEntity = _TablesInsert<"diagrams">;
export type DiagramUpdateEntity = _TablesUpdate<"diagrams">;

// Route params
export interface DiagramIdParam {
  id: number;
}

// Query params for listing
export interface ListDiagramsQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  filter?: string;
}

// Pagination meta for responses
export interface PaginationMetaDTO {
  page: number;
  limit: number;
  total: number;
}

// Note on updated_at: The current database schema does not expose an updated_at column
// for the diagrams table. Some API examples include updated_at. To keep DTOs compatible
// with both the database entity and API examples, we model updated_at as optional.

export type DiagramDTO = Pick<
  DiagramEntity,
  "id" | "name" | "definition" | "solution" | "created_at"
> & {
  // Optional field to align with API examples; not present in DiagramEntity today.
  updated_at?: string | null;
};

export type DiagramListItemDTO = DiagramDTO;

export interface ListDiagramsResponseDTO {
  data: DiagramListItemDTO[];
  pagination: PaginationMetaDTO;
}

export type GetDiagramResponseDTO = DiagramDTO;

// Commands (request payloads)
export type CreateDiagramCommand = Pick<
  DiagramInsertEntity,
  "name" | "definition"
>;

export type UpdateDiagramCommand = Partial<
  Pick<DiagramUpdateEntity, "name" | "definition" | "solution">
>;

// Responses for mutations
export type CreateDiagramResponseDTO = DiagramDTO;
export type UpdateDiagramResponseDTO = DiagramDTO;
export interface DeleteDiagramResponseDTO {
  message: string;
}

// Solve endpoint
export type SolveDiagramResponseDTO = DiagramDTO;
