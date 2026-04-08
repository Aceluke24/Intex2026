import type { ReactNode } from "react";
import { Link } from "react-router-dom";
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
      {/* LEFT — Logo */}
      <div className="flex shrink-0 items-center gap-3">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0B1D2A]"
          aria-label="North Star Sanctuary — Home"
        >
          <img src="/logo.png" alt="" className="h-8 w-8 object-contain invert-0 dark:invert-0" decoding="async" />
          <span className="font-semibold text-lg text-gray-900 dark:text-white">North Star Sanctuary</span>
        </Link>
      </div>

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
