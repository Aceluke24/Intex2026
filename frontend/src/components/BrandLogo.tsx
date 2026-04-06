import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import logoSrc from "@/assets/north-star-logo.png";

export type BrandLogoVariant = "nav" | "footer" | "hero" | "inline" | "compact";

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  /** Wrap in a link to the homepage (typical for nav). */
  asLink?: boolean;
  to?: string;
  className?: string;
  imgClassName?: string;
};

/**
 * North Star Sanctuary mark — PNG with transparent background, tight-cropped to ink.
 * Nav/footer/compact: height-led. Hero/inline: width-led + max-height so the full mark stays visible.
 */
export function BrandLogo({
  variant = "nav",
  asLink = false,
  to = "/",
  className,
  imgClassName,
}: BrandLogoProps) {
  const img = (
    <img
      src={logoSrc}
      alt=""
      role="img"
      aria-hidden
      decoding="async"
      className={cn(
        "object-contain pointer-events-none",
        variant === "hero"
          ? "block h-auto w-[min(22rem,88vw)] sm:w-[min(26rem,82vw)] lg:w-[min(30rem,78vw)] max-h-[min(44vh,12rem)] max-w-full shrink-0 bg-transparent drop-shadow-[0_2px_28px_rgba(0,0,0,0.2)]"
          : "w-auto max-w-full",
        variant === "nav" && "object-left",
        variant === "footer" && "object-left",
        variant === "inline" && "object-center",
        variant === "compact" && "object-left",
        variant === "nav" &&
          "h-10 w-auto sm:h-11 md:h-[3.35rem] max-w-[min(200px,46vw)] sm:max-w-[min(220px, 38vw)]",
        variant === "footer" &&
          "h-[4.25rem] w-auto sm:h-[4.75rem] md:h-28 max-w-[min(260px, 72vw)]",
        variant === "inline" &&
          "block h-auto w-[min(18rem,88vw)] sm:w-[min(22rem,85vw)] md:w-[min(26rem,80vw)] max-h-[min(36vh,9rem)] sm:max-h-[min(38vh,10rem)]",
        variant === "compact" && "h-9 w-auto sm:h-10 md:h-11 max-w-[min(140px, 42vw)]",
        imgClassName
      )}
    />
  );

  const inner =
    variant === "hero" ? (
      <span className={cn("flex w-full max-w-full justify-center leading-none", className)}>{img}</span>
    ) : (
      <span className={cn("inline-flex items-center shrink-0 leading-none", className)}>{img}</span>
    );

  if (asLink) {
    return (
      <Link
        to={to}
        className={cn(
          "inline-flex items-center gap-2.5 sm:gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          className
        )}
        aria-label="North Star Sanctuary — Home"
      >
        {img}
      </Link>
    );
  }

  return inner;
}

type BrandLockupProps = {
  variant?: "nav" | "footer";
  className?: string;
};

/** Logo + wordmark for horizontal bars (nav / footer). */
export function BrandLockup({ variant = "nav", className }: BrandLockupProps) {
  const isNav = variant === "nav";
  return (
    <Link
      to="/"
      className={cn(
        "group inline-flex items-center gap-3 sm:gap-3.5 shrink-0 min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
      aria-label="North Star Sanctuary — Home"
    >
      <BrandLogo variant={isNav ? "nav" : "footer"} imgClassName="transition-transform duration-300 group-hover:scale-[1.02]" />
      <span
        className={cn(
          "font-display font-semibold tracking-tight text-left leading-snug",
          isNav ? "text-[15px] sm:text-base text-foreground hidden min-[380px]:block max-w-[11rem] sm:max-w-none" : "text-base sm:text-lg text-navy-foreground"
        )}
      >
        {isNav ? (
          <>
            North Star
            <span className="text-muted-foreground font-medium"> Sanctuary</span>
          </>
        ) : (
          "North Star Sanctuary"
        )}
      </span>
    </Link>
  );
}
