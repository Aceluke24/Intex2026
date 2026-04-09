import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { baseHeaderClasses } from "./headerStyles";

export { baseHeaderClasses } from "./headerStyles";
export { primaryButtonClasses } from "@/lib/primaryButton";

type HeaderProps = {
  title: string;
  subtitle?: string | null;
  rightContent: ReactNode;
  className?: string;
};

export default function Header({ title, subtitle, rightContent, className }: HeaderProps) {
  return (
    <header className={cn(baseHeaderClasses, className)}>
      {/* LEFT — Spacer for centered title alignment */}
      <div className="w-8 shrink-0" aria-hidden="true" />

      {/* CENTER — Page Title */}
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-2 text-center">
        <h1 className="max-w-full truncate text-base font-semibold text-gray-900 dark:text-white">{title}</h1>
        {subtitle && (
          <p className="max-w-full truncate text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
      </div>

      {/* RIGHT — Actions */}
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-4">{rightContent}</div>
    </header>
  );
}
