import { Button } from "../ui/button";
import type { PaginationMetaDTO } from "../../types";

interface PaginationProps extends PaginationMetaDTO {
  onChange: (page: number) => void;
}

export function Pagination({ page, limit, total, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Button variant="outline" size="sm" onClick={() => onChange(page - 1)} disabled={page === 1}>
        Previous
      </Button>
      <span className="text-sm">
        Page {page} of {totalPages}
      </span>
      <Button variant="outline" size="sm" onClick={() => onChange(page + 1)} disabled={page === totalPages}>
        Next
      </Button>
    </div>
  );
}
