import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  ClipboardList,
  FileText,
  Heart,
  Activity,
  MapPin,
  FilePlus,
  Plus,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

const nav = [
  { label: "Admin Dashboard", path: "/dashboard/programs", icon: Activity, keywords: "home overview programs operations" },
  { label: "Caseload Inventory", path: "/dashboard/caseload", icon: ClipboardList, keywords: "cases residents" },
  { label: "Process Recordings", path: "/dashboard/recordings", icon: FileText, keywords: "sessions therapy notes" },
  { label: "Visitations & Conferences", path: "/dashboard/visitations", icon: MapPin, keywords: "home visits field" },
  { label: "Donors & Contributions", path: "/dashboard/donors", icon: Heart, keywords: "crm supporters" },
  { label: "Reports", path: "/dashboard/reports", icon: BarChart3, keywords: "analytics charts metrics" },
  { label: "Insights & Actions", path: "/dashboard/analytics/pipelines", icon: BarChart3, keywords: "decision intelligence donor retention outreach actions" },
];

const actions = [
  {
    label: "Add resident (demo)",
    icon: UserPlus,
    run: () => toast.message("Quick action", { description: "Connects to intake workflow in production." }),
  },
  {
    label: "Log donation (demo)",
    icon: Plus,
    run: () => toast.message("Quick action", { description: "Opens contribution dialog from Donors page." }),
  },
  {
    label: "New process record (demo)",
    icon: FilePlus,
    run: () => toast.message("Quick action", { description: "Use Process Recording → New Entry." }),
  },
];

type GlobalCommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GlobalCommandPalette({ open, onOpenChange }: GlobalCommandPaletteProps) {
  const navigate = useNavigate();

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages and actions…" className="font-body" />
      <CommandList>
        <CommandEmpty className="py-6 font-body text-sm text-muted-foreground">No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {nav.map((item) => (
            <CommandItem
              key={item.path}
              value={`${item.label} ${item.keywords}`}
              onSelect={() => go(item.path)}
              className="font-body"
            >
              <item.icon className="mr-2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick actions">
          {actions.map((a) => (
            <CommandItem
              key={a.label}
              value={a.label}
              onSelect={() => {
                a.run();
                onOpenChange(false);
              }}
              className="font-body"
            >
              <a.icon className="mr-2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              {a.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
