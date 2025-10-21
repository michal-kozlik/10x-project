import { useState, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import type { DiagramDTO } from "../../types";

interface DeleteDiagramDialogProps {
  diagram: DiagramDTO;
  onConfirm: (id: number) => Promise<void>;
  disabled?: boolean;
}

export function DeleteDiagramDialog({ diagram, onConfirm, disabled }: DeleteDiagramDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = useCallback(async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      await onConfirm(diagram.id);
      setIsOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }, [diagram.id, isDeleting, onConfirm]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Delete" && !disabled) {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    },
    [disabled, isOpen]
  );

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete diagram ${diagram.name}`}
          disabled={disabled}
          onKeyDown={handleKeyPress}
          tabIndex={0}
          role="button"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete diagram</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{diagram.name}"? This action cannot be undone.
            {isDeleting && (
              <span className="block mt-2 text-muted-foreground" role="status">
                Deleting...
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} aria-label="Cancel deletion">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label={`Confirm deletion of diagram ${diagram.name}`}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
