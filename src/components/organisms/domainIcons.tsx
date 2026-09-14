/** Line-icon alternative to the uploaded glass-style domain icons (see
 *  DomainCarousel's USE_LINE_ICONS flag): 32x32 viewBox, no fill,
 *  currentColor stroke, round caps/joins, and the same construction
 *  language as the coral-club-test.netlify.app reference's own icon
 *  set — one or two bold strokes/arcs filling most of the box, with a
 *  small decorative accent (sparkle, dot) layered on a couple of them,
 *  rather than a single dense many-point curve. One per
 *  content/domains.json id. */

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
      {/* nested coil/shell — three same-direction hooks, nautilus/gut
          metaphor built the same way as the reference's own icons: a
          few bold arc strokes, not a dense many-point curve */}
      <path d="M26 12a11 11 0 1 0-9 18" {...stroke} />
      <path d="M21.5 15a6 6 0 1 0-5.5 10" {...stroke} />
      <path d="M17.5 18a2.2 2.2 0 1 0-2 4" {...stroke} />
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
      {/* one big sparkle filling most of the box + a small accent
          sparkle, the same "big shape + small accent" pairing the
          reference uses for its own moon/mountain + sparkle icons */}
      <path
        d="M14 4c1 5.5 2.6 8.8 7 11-4.4 2.2-6 5.5-7 11-1-5.5-2.6-8.8-7-11 4.4-2.2 6-5.5 7-11Z"
        {...stroke}
      />
      <path
        d="M25 20c.4 1.7 1 2.4 2.6 2.8-1.6.4-2.2 1.1-2.6 2.8-.4-1.7-1-2.4-2.6-2.8 1.6-.4 2.2-1.1 2.6-2.8Z"
        {...stroke}
      />
    </svg>
  );
}

function LongevityIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      {/* sprouting leaves on a stem — vitality/growing-older-well
          metaphor, distinct from Brain & Focus's own concentric circles */}
      <path d="M16 28V14" {...stroke} />
      <path d="M16 14c0-5 4-8 9-8 0 5-4 8-9 8Z" {...stroke} />
      <path d="M16 18c0-4-3-6.5-7-6.5 0 4 3 6.5 7 6.5Z" {...stroke} />
    </svg>
  );
}

function VisionEyesIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        d="M3 16c0-1 5.5-11 13-11s13 10 13 11-5.5 11-13 11S3 17 3 16Z"
        {...stroke}
      />
      <circle cx="16" cy="16" r="4.5" {...stroke} />
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
