import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type SlideOverPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
};

/** Right sheet with soft backdrop and generous width for profile detail. */
export function SlideOverPanel({ open, onOpenChange, children, className }: SlideOverPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        overlayClassName="bg-[hsl(213_45%_12%)]/25 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        className={cn(
          "flex h-full max-h-screen flex-col overflow-hidden border-0 p-0 sm:max-w-[min(100%,28rem)] lg:max-w-[min(100%,32rem)]",
          "bg-[hsl(36_33%_97%)]/92 backdrop-blur-xl dark:bg-[hsl(213_45%_10%)]/95",
          "shadow-[0_0_0_1px_rgba(255,255,255,0.5),-24px_0_80px_rgba(45,35,48,0.08)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04),-24px_0_80px_rgba(0,0,0,0.45)]",
          "data-[state=open]:duration-500 data-[state=closed]:duration-300",
          className
        )}
      >
        {children}
      </SheetContent>
    </Sheet>
  );
}
