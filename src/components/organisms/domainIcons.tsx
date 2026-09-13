/** Line-icon alternative to the uploaded glass-style domain icons (see
 *  DomainCarousel's USE_LINE_ICONS flag) — same stroke style as the
 *  TabBar/SiteHeader nav icons (navIcons.tsx): 24x24 viewBox, no fill,
 *  currentColor stroke, round caps. One per content/domains.json id. */

import type { ReactNode } from "react";

type IconProps = { className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.3,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function EnergyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M13 3 5 13.5h5.5L11 21l8-10.5h-5.5L13 3Z" {...stroke} />
    </svg>
  );
}

function WeightMetabolismIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 3c3 3.6 5.5 7 5.5 10a5.5 5.5 0 1 1-11 0c0-3 2.5-6.4 5.5-10Z"
        {...stroke}
      />
    </svg>
  );
}

function DigestionGutIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {/* Archimedean spiral (~2.15 turns), coil/gut metaphor — smooth
          cubic-bezier curve through the sampled points, not straight
          line segments, so it reads as round rather than faceted */}
      <path
        d="M21.3 12.0 C20.99 12.83 20.45 15.64 19.45 16.96 C18.45 18.28 16.82 19.42 15.32 19.94 C13.82 20.46 11.91 20.5 10.43 20.11 C8.95 19.72 7.42 18.72 6.45 17.63 C5.48 16.54 4.79 14.93 4.6 13.54 C4.41 12.15 4.72 10.51 5.31 9.31 C5.9 8.11 7.02 6.98 8.12 6.34 C9.22 5.7 10.71 5.4 11.91 5.48 C13.12 5.56 14.45 6.12 15.35 6.82 C16.25 7.52 17.0 8.65 17.34 9.68 C17.68 10.71 17.66 11.99 17.39 12.97 C17.12 13.95 16.43 14.94 15.7 15.55 C14.97 16.16 13.92 16.56 13.04 16.66 C12.16 16.76 11.13 16.52 10.4 16.13 C9.67 15.74 9.02 15.02 8.66 14.35 C8.3 13.68 8.19 12.79 8.27 12.1 C8.35 11.41 8.72 10.68 9.13 10.2 C9.54 9.72 10.2 9.37 10.75 9.23 C11.3 9.09 11.96 9.16 12.44 9.34 C12.91 9.52 13.35 9.92 13.6 10.29 C13.85 10.66 13.95 11.16 13.94 11.54 C13.93 11.92 13.75 12.32 13.55 12.57 C13.35 12.82 12.89 12.97 12.76 13.05"
        {...stroke}
      />
    </svg>
  );
}

function ImmunityIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 3.5 19 6v6c0 5-3 8-7 9-4-1-7-4-7-9V6l7-2.5Z"
        {...stroke}
      />
      <path d="M9 12.2 11.2 14.5 15.5 10" {...stroke} />
    </svg>
  );
}

function SleepStressIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M14.5 4a7 7 0 1 0 6.2 10.4A7.8 7.8 0 0 1 14.5 4Z"
        {...stroke}
      />
    </svg>
  );
}

function BrainFocusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8" {...stroke} />
      <circle cx="12" cy="12" r="2.6" {...stroke} />
    </svg>
  );
}

function HeartVesselsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 20s-7.5-4.6-9.5-9C1.2 7.8 3 4.5 6.3 4.5c2 0 3.5 1.2 5.7 4 2.2-2.8 3.7-4 5.7-4 3.3 0 5.1 3.3 3.8 6.5-2 4.4-9.5 9-9.5 9Z"
        {...stroke}
      />
    </svg>
  );
}

function BonesJointsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {/* side-bend stretch, raised arm + wide stance — gymnastics/
          flexibility metaphor, adapted from a reference pictogram */}
      <circle cx="17" cy="9.5" r="1.8" {...stroke} />
      <path d="M10.5 0.5 L10.5 7" {...stroke} />
      <path d="M10.5 7 C12 9 15 10.5 12.5 14" {...stroke} />
      <path d="M12.5 14 L5 21" {...stroke} />
      <path d="M12.5 14 L20 21" {...stroke} />
    </svg>
  );
}

function SkinHairNailsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 3c.7 3 1.8 4.2 4.8 5-3 .8-4.1 2-4.8 5-.7-3-1.8-4.2-4.8-5 3-.8 4.1-2 4.8-5Z"
        {...stroke}
      />
      <path d="M18 15.5c.4 1.6 1 2.2 2.5 2.6-1.5.4-2.1 1-2.5 2.6-.4-1.6-1-2.2-2.5-2.6 1.5-.4 2.1-1 2.5-2.6Z" {...stroke} />
    </svg>
  );
}

function LongevityIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="8.5" cy="12" r="3.6" {...stroke} />
      <circle cx="15.5" cy="12" r="3.6" {...stroke} />
    </svg>
  );
}

function VisionEyesIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        {...stroke}
      />
      <circle cx="12" cy="12" r="2.6" {...stroke} />
    </svg>
  );
}

function ReproductiveIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="9" r="4" {...stroke} />
      <path d="M12 13v7M9 17h6" {...stroke} />
    </svg>
  );
}

/** id (content/domains.json) -> icon component. */
export const DOMAIN_ICONS: Record<string, (props: IconProps) => ReactNode> = {
  energy: EnergyIcon,
  "weight-metabolism": WeightMetabolismIcon,
  "digestion-gut": DigestionGutIcon,
  immunity: ImmunityIcon,
  "sleep-stress": SleepStressIcon,
  "brain-focus": BrainFocusIcon,
  "heart-vessels": HeartVesselsIcon,
  "bones-joints": BonesJointsIcon,
  "skin-hair-nails": SkinHairNailsIcon,
  longevity: LongevityIcon,
  "vision-eyes": VisionEyesIcon,
  reproductive: ReproductiveIcon,
};
