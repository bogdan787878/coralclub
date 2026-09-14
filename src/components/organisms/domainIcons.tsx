/** Line-icon alternative to the uploaded glass-style domain icons (see
 *  DomainCarousel's USE_LINE_ICONS flag): 32x32 viewBox, no fill,
 *  currentColor stroke, round caps/joins — same technical grid and
 *  relative line weight (stroke-width 1.5 in a 32-unit box) as the
 *  coral-club-test.netlify.app reference's own quiz-category icon set.
 *  One per content/domains.json id. */

import type { ReactNode } from "react";

type IconProps = { className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function EnergyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M17.33 4 6.67 18h7.33L14.67 28l10.67-14h-7.33L17.33 4Z" {...stroke} />
    </svg>
  );
}

function WeightMetabolismIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        d="M16 4c4 4.8 7.33 9.33 7.33 13.33a7.33 7.33 0 1 1-14.67 0c0-4 3.33-8.53 7.33-13.33Z"
        {...stroke}
      />
    </svg>
  );
}

function DigestionGutIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      {/* Archimedean spiral (~2.15 turns), coil/gut metaphor — smooth
          cubic-bezier curve through the sampled points, not straight
          line segments, so it reads as round rather than faceted */}
      <path
        d="M28.4 16 C27.99 17.11 27.27 20.85 25.93 22.61 C24.6 24.37 22.43 25.89 20.43 26.59 C18.43 27.28 15.88 27.33 13.91 26.81 C11.93 26.29 9.89 24.96 8.6 23.51 C7.31 22.05 6.39 19.91 6.13 18.05 C5.88 16.2 6.29 14.01 7.08 12.41 C7.87 10.81 9.36 9.31 10.83 8.45 C12.29 7.6 14.28 7.2 15.88 7.31 C17.49 7.41 19.27 8.16 20.47 9.09 C21.67 10.03 22.67 11.53 23.12 12.91 C23.57 14.28 23.55 15.99 23.19 17.29 C22.83 18.6 21.91 19.92 20.93 20.73 C19.96 21.55 18.56 22.08 17.39 22.21 C16.21 22.35 14.84 22.03 13.87 21.51 C12.89 20.99 12.03 20.03 11.55 19.13 C11.07 18.24 10.92 17.05 11.03 16.13 C11.13 15.21 11.63 14.24 12.17 13.6 C12.72 12.96 13.6 12.49 14.33 12.31 C15.07 12.12 15.95 12.21 16.59 12.45 C17.21 12.69 17.8 13.23 18.13 13.72 C18.47 14.21 18.6 14.88 18.59 15.39 C18.57 15.89 18.33 16.43 18.07 16.76 C17.8 17.09 17.19 17.29 17.01 17.4"
        {...stroke}
      />
    </svg>
  );
}

function ImmunityIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        d="M16 4.67 25.33 8v8c0 6.67-4 10.67-9.33 12-5.33-1.33-9.33-5.33-9.33-12V8l9.33-3.33Z"
        {...stroke}
      />
      <path d="M12 16.27 14.93 19.33 20.67 13.33" {...stroke} />
    </svg>
  );
}

function SleepStressIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        d="M19.33 5.33a9.33 9.33 0 1 0 8.27 13.87A10.4 10.4 0 0 1 19.33 5.33Z"
        {...stroke}
      />
    </svg>
  );
}

function BrainFocusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="10.67" {...stroke} />
      <circle cx="16" cy="16" r="3.47" {...stroke} />
    </svg>
  );
}

function HeartVesselsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        d="M16 26.67s-10-6.13-12.67-12C1.6 10.4 4 6 8.4 6c2.67 0 4.67 1.6 7.6 5.33 2.93-3.73 4.93-5.33 7.6-5.33 4.4 0 6.8 4.4 5.07 8.67-2.67 5.87-12.67 12-12.67 12Z"
        {...stroke}
      />
    </svg>
  );
}

function BonesJointsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      {/* side-bend stretch, raised arm + wide stance — gymnastics/
          flexibility metaphor, adapted from a reference pictogram */}
      <circle cx="22.67" cy="12.67" r="2.4" {...stroke} />
      <path d="M14 0.67 L14 9.33" {...stroke} />
      <path d="M14 9.33 C16 12 20 14 16.67 18.67" {...stroke} />
      <path d="M16.67 18.67 L6.67 28" {...stroke} />
      <path d="M16.67 18.67 L26.67 28" {...stroke} />
    </svg>
  );
}

function SkinHairNailsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        d="M16 4c.93 4 2.4 5.6 6.4 6.67-4 1.07-5.47 2.67-6.4 6.67-.93-4-2.4-5.6-6.4-6.67 4-1.07 5.47-2.67 6.4-6.67Z"
        {...stroke}
      />
      <path
        d="M24 20.67c.53 2.13 1.33 2.93 3.33 3.47-2 .53-2.8 1.33-3.33 3.47-.53-2.13-1.33-2.93-3.33-3.47 2-.53 2.8-1.33 3.33-3.47Z"
        {...stroke}
      />
    </svg>
  );
}

function LongevityIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="11.33" cy="16" r="4.8" {...stroke} />
      <circle cx="20.67" cy="16" r="4.8" {...stroke} />
    </svg>
  );
}

function VisionEyesIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        d="M3.33 16S8 8 16 8s12.67 8 12.67 8-4.67 8-12.67 8-12.67-8-12.67-8Z"
        {...stroke}
      />
      <circle cx="16" cy="16" r="3.47" {...stroke} />
    </svg>
  );
}

function ReproductiveIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="12" r="5.33" {...stroke} />
      <path d="M16 17.33v9.33M12 22.67h8" {...stroke} />
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
