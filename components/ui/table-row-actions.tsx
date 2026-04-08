"use client";

import { useState, type ReactNode } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export interface TableRowActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  /** Shown in the confirmation body (e.g. product or brand name). */
  itemName: string;
  /** Alert title; default uses `deleteVerb`. */
  confirmTitle?: string;
  /** Full custom description; overrides default sentence when set. */
  confirmDescription?: ReactNode;
  /** Primary button and menu label: "Delete", "Remove", etc. */
  deleteVerb?: string;
  /** Hide delete option (e.g. role-gated). */
  showDelete?: boolean;
  align?: "start" | "center" | "end";
  triggerClassName?: string;
  disabled?: boolean;
}

/**
 * Kebab menu with Edit + Delete; delete opens a confirmation dialog instead of `window.confirm`.
 */
export function TableRowActions({
  onEdit,
  onDelete,
  itemName,
  confirmTitle,
  confirmDescription,
  deleteVerb = "Delete",
  showDelete = true,
  align = "end",
  triggerClassName,
  disabled = false,
}: TableRowActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 shrink-0", triggerClassName)}
            aria-label="Open row actions"
            disabled={disabled}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align}>
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          {showDelete && (
            <DropdownMenuItem
              onClick={() => setConfirmOpen(true)}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleteVerb}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {showDelete && (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmTitle ?? `${deleteVerb} “${itemName}”?`}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmDescription !== undefined ? (
                  confirmDescription
                ) : (
                  <>
                    This will permanently remove{" "}
                    <span className="font-medium text-foreground">{itemName}</span>. This action cannot be undone.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  onDelete();
                  setConfirmOpen(false);
                }}
              >
                {deleteVerb}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
