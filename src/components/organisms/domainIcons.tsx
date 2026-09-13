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
      <path
        d="M8 4c-2.5 0-4 2-4 4.2 0 3 3 3.3 3 6 0 2 -1.5 2.8 -1.5 4.6 0 1.2 1 2.2 2.5 2.2s2.5-1.2 2.5-2.6c0-2.4-2-3-2-5.8 0-2.6 4-2.6 4-5.6C12.5 5 10.5 4 8 4Z"
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
      <circle cx="17.3" cy="2.6" r="1.7" {...stroke} />
      <path
        d="M19.6 0.3 C18.3 1.6 17.1 3.6 16.7 5.8 C16.2 8.4 14.9 10.7 13 13 C11.3 15 9.6 16.6 8 18.2 C7 19.2 6.2 19.8 5.2 20.6"
        {...stroke}
      />
      <path d="M13 13 C16 13.7 18.6 14.9 21.2 16.5 L23 17.8" {...stroke} />
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
