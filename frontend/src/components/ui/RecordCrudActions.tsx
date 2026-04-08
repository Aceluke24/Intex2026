import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eye, Pencil, Trash2 } from "lucide-react";

type RecordCrudActionsProps = {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
};

const iconBtnNeutral =
  "h-8 w-8 rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-muted/50 hover:text-foreground dark:hover:bg-white/10";
const iconBtnDelete =
  "h-8 w-8 rounded-lg text-destructive/80 transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive";

/**
 * Shared dashboard CRUD icon row: hidden until parent `group` hover.
 * Place top-right of a `group relative` card/row; uses opacity + slide, no layout shift.
 */
export function RecordCrudActions({ onView, onEdit, onDelete, className }: RecordCrudActionsProps) {
  if (!onView && !onEdit && !onDelete) return null;

  return (
    <div
      role="toolbar"
      aria-label="Record actions"
      className={cn(
        "flex items-center gap-0.5",
        "pointer-events-none opacity-0 translate-x-1",
        "transition-all duration-200 ease-out",
        "group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-x-0",
        className
      )}
    >
      {onView && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={iconBtnNeutral}
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          aria-label="View"
        >
          <Eye className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      )}
      {onEdit && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={iconBtnNeutral}
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          aria-label="Edit"
        >
          <Pencil className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      )}
      {onDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={iconBtnDelete}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      )}
    </div>
  );
}
