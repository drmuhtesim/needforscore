import React, { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { CategoryType } from "./CategorySidebar";

type Cat = Exclude<CategoryType, "all">;

interface AddEntryDialogProps {
  trigger?: React.ReactNode;
  initialTarget?: string;
  initialCategory?: Cat;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const loadDialog = () => import("./AddEntryDialog");
const AddEntryDialog = lazy(loadDialog);

const LazyAddEntryDialog = ({ trigger, open: openProp, onOpenChange, ...props }: AddEntryDialogProps = {}) => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [shouldLoad, setShouldLoad] = useState(Boolean(openProp));
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;

  useEffect(() => {
    if (openProp) setShouldLoad(true);
  }, [openProp]);

  const setOpen = (next: boolean) => {
    setOpenInternal(next);
    onOpenChange?.(next);
  };

  const requestOpen = (event?: React.MouseEvent) => {
    event?.preventDefault();
    if (!user) {
      navigate("/auth?mode=signin");
      return;
    }
    if (profile && !profile.email_verified) {
      toast({
        title: t("verify.requiredTitle"),
        description: t("verify.requiredDesc"),
        variant: "destructive",
      });
      return;
    }
    setShouldLoad(true);
    setOpen(true);
  };

  const preload = () => {
    void loadDialog();
  };

  const fallbackTrigger = trigger && React.isValidElement(trigger) ? (
    React.cloneElement(trigger as React.ReactElement<any>, {
      onClick: (event: React.MouseEvent) => {
        (trigger as React.ReactElement<any>).props.onClick?.(event);
        if (!event.defaultPrevented) requestOpen(event);
      },
      onPointerEnter: (event: React.PointerEvent) => {
        (trigger as React.ReactElement<any>).props.onPointerEnter?.(event);
        preload();
      },
      onFocus: (event: React.FocusEvent) => {
        (trigger as React.ReactElement<any>).props.onFocus?.(event);
        preload();
      },
    })
  ) : (
    <Button
      size="sm"
      onClick={requestOpen}
      onPointerEnter={preload}
      onFocus={preload}
      className="gap-1.5 bg-gradient-to-r from-[hsl(285_85%_60%)] via-[hsl(330_85%_60%)] to-[hsl(25_95%_60%)] text-white border-0 hover:opacity-90"
    >
      <Plus className="h-4 w-4" />
      {t("entry.add")}
    </Button>
  );

  if (!shouldLoad) return fallbackTrigger;

  return (
    <Suspense fallback={fallbackTrigger}>
      <AddEntryDialog trigger={trigger} open={open} onOpenChange={setOpen} {...props} />
    </Suspense>
  );
};

export default LazyAddEntryDialog;