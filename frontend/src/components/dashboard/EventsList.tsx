import type { CalendarEvent } from "@/lib/dashboardMockData";
import { Calendar, Home, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const typeIcon: Record<CalendarEvent["type"], LucideIcon> = {
  conference: Video,
  visit: Home,
  other: Calendar,
};

type EventsListProps = {
  events: CalendarEvent[];
};

export function EventsList({ events }: EventsListProps) {
  return (
    <ul className="divide-y divide-[hsl(350,16%,93%)]/90">
      {events.map((ev) => {
        const Icon = typeIcon[ev.type];
        return (
          <li
            key={ev.id}
            className="group flex gap-5 py-5 first:pt-0 last:pb-0 transition-colors duration-200 hover:bg-[hsl(350,25%,99%)]/50"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[hsl(350,28%,96%)] text-[hsl(340,28%,44%)] transition-all duration-200 group-hover:bg-[hsl(350,32%,93%)]">
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.65} aria-hidden />
            </div>
            <div className="min-w-0 flex-1 border-b border-transparent pb-1 group-last:border-0">
              <p className="font-body text-[15px] font-semibold leading-snug text-foreground">{ev.title}</p>
              <p className="mt-1 font-body text-sm text-muted-foreground">{ev.datetime}</p>
              <p className="mt-0.5 font-body text-xs text-muted-foreground/90">{ev.location}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
