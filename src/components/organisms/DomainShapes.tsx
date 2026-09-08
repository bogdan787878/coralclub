import type { ReactNode } from "react";

/**
 * Abstract flat silhouettes for the 12 personalization domains — one organic
 * shape each, evoking the domain's metaphor (Yandex-Music-redesign vibe).
 * `currentColor` drives the fill; a soft halo sits behind.
 */

const V = "0 0 100 100";

function Shape({
  children,
  viewBox = V,
}: {
  children: ReactNode;
  viewBox?: string;
}) {
  return (
    <svg viewBox={viewBox} fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}

export const DOMAIN_COLOR: Record<string, string> = {
  energy: "#F5A623",
  "weight-metabolism": "#F2724C",
  "digestion-gut": "#3FA96B",
  immunity: "#2FA9A0",
  "sleep-stress": "#5B6EE1",
  "brain-focus": "#8A63D2",
  "heart-vessels": "#E85C6B",
  "bones-joints": "#8792A6",
  "skin-hair-nails": "#E86AA6",
  longevity: "#6C4BB0",
  "vision-eyes": "#3AB6D9",
  reproductive: "#F08A7A",
};

export const DOMAIN_SHAPE: Record<string, ReactNode> = {
  // lightning
  energy: (
    <Shape>
      <path
        d="M56 12 30 52h16L40 88l32-46H54z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="11"
        strokeLinejoin="round"
      />
    </Shape>
  ),
  // flame
  "weight-metabolism": (
    <Shape>
      <path
        d="M50 12c13 18 26 24 26 42a26 26 0 1 1-52 0c0-11 5-17 10-25 2 8 8 11 12 6C42 30 43 21 50 12z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinejoin="round"
      />
    </Shape>
  ),
  // coil / loop
  "digestion-gut": (
    <Shape>
      <path
        d="M70 26a26 26 0 1 0 6 30c2-11-6-19-16-19s-15 8-13 17"
        fill="none"
        stroke="currentColor"
        strokeWidth="16"
        strokeLinecap="round"
      />
    </Shape>
  ),
  // shield
  immunity: (
    <Shape>
      <path
        d="M50 12 82 22v26c0 24-15 36-32 44C33 84 18 72 18 48V22z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinejoin="round"
      />
    </Shape>
  ),
  // cloud with Zzz (converted from the provided CustomPainter paths)
  "sleep-stress": (
    <Shape viewBox="0 2 182 136">
      <path
        d="M50 68C64 68 76 72 85 78C93 84 100 92 100 100C100 110 93 119 85 125C76 131 64 134 50 134C36 134 24 131 15 125C7 119 1 110 1 100C1 92 7 84 15 78C24 72 36 68 50 68Z"
        fill="currentColor"
      />
      <path
        d="M84 34C111 34 134 57 134 84C134 112 111 134 84 134C56 134 34 112 34 84C34 57 56 34 84 34Z"
        fill="currentColor"
      />
      <path
        d="M130 62C144 62 156 65 165 71C173 77 179 86 179 95C179 104 173 112 165 118C156 124 144 128 130 128C116 128 104 124 95 118C87 112 81 104 81 95C81 86 87 77 95 71C104 65 116 62 130 62Z"
        fill="currentColor"
      />
      <path
        d="M124 7C128 6 148 7 151 7C152 7 145 10 135 15C124 19 120 24 119 24C122 25 128 25 136 26C140 27 145 28 150 30M121 35C122 35 126 35 130 35C131 36 127 38 123 42C122 43 123 44 124 45C128 47 131 49 133 49"
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Shape>
  ),
  // focus donut
  "brain-focus": (
    <Shape>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M50 14a36 36 0 1 0 0 72 36 36 0 0 0 0-72zm0 22a14 14 0 1 1 0 28 14 14 0 0 1 0-28z"
        fill="currentColor"
      />
    </Shape>
  ),
  // heart
  "heart-vessels": (
    <Shape>
      <path
        d="M50 84 22 54a17 17 0 0 1 24-24l4 4 4-4a17 17 0 0 1 24 24z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinejoin="round"
      />
    </Shape>
  ),
  // bone
  "bones-joints": (
    <Shape>
      <path
        d="M30 32a13 13 0 1 0 0 26 13 13 0 0 0 11-6h18a13 13 0 1 0 11 6 13 13 0 1 0 0-26 13 13 0 0 0-11 6H41a13 13 0 0 0-11-6z"
        fill="currentColor"
      />
    </Shape>
  ),
  // sparkle
  "skin-hair-nails": (
    <Shape>
      <path
        d="M50 12c3 20 16 33 38 38-22 5-35 18-38 38-3-20-16-33-38-38 22-5 35-18 38-38z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinejoin="round"
      />
    </Shape>
  ),
  // infinity — two overlapping rings
  longevity: (
    <Shape>
      <path
        d="M36 34a16 16 0 1 0 0 32 16 16 0 1 0 0-32zm28 0a16 16 0 1 0 0 32 16 16 0 1 0 0-32z"
        fill="none"
        stroke="currentColor"
        strokeWidth="12"
      />
    </Shape>
  ),
  // eye
  "vision-eyes": (
    <Shape>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M50 28c20 0 36 13 44 22-8 9-24 22-44 22S14 59 6 50c8-9 24-22 44-22zm0 10a12 12 0 1 0 0 24 12 12 0 0 0 0-24z"
        fill="currentColor"
      />
    </Shape>
  ),
  // sprout
  reproductive: (
    <Shape>
      <path
        d="M50 88V50m0 0c0-14 12-24 28-24 0 16-12 26-28 24zm0 0c0-12-10-22-26-22 0 14 12 24 26 22z"
        fill="none"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Shape>
  ),
};
