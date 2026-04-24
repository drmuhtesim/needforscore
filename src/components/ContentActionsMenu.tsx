import { ReactNode, useState } from "react";
import { MoreHorizontal, Pencil, Trash2, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

interface Props {
  canEdit?: boolean;
  canDelete?: boolean;
  canModerate?: boolean;
  onEdit?: () => void;
  onDelete?: () => void | Promise<void>;
  onModerate?: () => void | Promise<void>;
  trigger?: ReactNode;
}

const ContentActionsMenu = ({
  canEdit,
  canDelete,
  canModerate,
  onEdit,
  onDelete,
  onModerate,
  trigger,
}: Props) => {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmModOpen, setConfirmModOpen] = useState(false);

  if (!canEdit && !canDelete && !canModerate) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          {trigger ?? (
            <button
              type="button"
              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[180px]">
          {canEdit && (
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              {t("actions.edit")}
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem onClick={() => setConfirmOpen(true)} className="text-danger">
              <Trash2 className="h-4 w-4 mr-2" />
              {t("actions.delete")}
            </DropdownMenuItem>
          )}
          {canModerate && (
            <>
              {(canEdit || canDelete) && <DropdownMenuSeparator />}
              <DropdownMenuItem onClick={() => setConfirmModOpen(true)} className="text-suspicious">
                <ShieldAlert className="h-4 w-4 mr-2" />
                {t("actions.removeByMod")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("actions.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("actions.confirmDeleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete?.()} className="bg-danger text-destructive-foreground hover:bg-danger/90">
              {t("actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmModOpen} onOpenChange={setConfirmModOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("actions.removeByMod")}</AlertDialogTitle>
            <AlertDialogDescription>{t("actions.confirmDeleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => onModerate?.()} className="bg-suspicious text-warning-foreground hover:bg-suspicious/90">
              {t("actions.removeByMod")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ContentActionsMenu;
