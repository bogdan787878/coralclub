/**
 * Флаг страны картинкой (SVG), а не эмодзи: эмодзи-флаги на Windows показываются буквами, а размер и вид
 * зависят от системы. Полосатые флаги нарисованы полосами; для остальных — плашка с кодом страны.
 */

type Stripes = { dir: "h" | "v"; bands: [color: string, weight?: number][] };

const FLAGS: Record<string, Stripes> = {
  DE: { dir: "h", bands: [["#000"], ["#DD0000"], ["#FFCE00"]] },
  RU: { dir: "h", bands: [["#FFFFFF"], ["#0039A6"], ["#D52B1E"]] },
  AT: { dir: "h", bands: [["#ED2939"], ["#FFFFFF"], ["#ED2939"]] },
  AM: { dir: "h", bands: [["#D90012"], ["#0033A0"], ["#F2A800"]] },
  BY: { dir: "h", bands: [["#C8313E", 2], ["#4AA657", 1]] },
  EE: { dir: "h", bands: [["#0072CE"], ["#000"], ["#FFFFFF"]] },
  HU: { dir: "h", bands: [["#CE2939"], ["#FFFFFF"], ["#477050"]] },
  IN: { dir: "h", bands: [["#FF9933"], ["#FFFFFF"], ["#138808"]] },
  LT: { dir: "h", bands: [["#FDB913"], ["#006A44"], ["#C1272D"]] },
  LV: { dir: "h", bands: [["#9E3039", 2], ["#FFFFFF", 1], ["#9E3039", 2]] },
  PL: { dir: "h", bands: [["#FFFFFF"], ["#DC143C"]] },
  UA: { dir: "h", bands: [["#0057B7"], ["#FFD700"]] },
  ES: { dir: "h", bands: [["#AA151B", 1], ["#F1BF00", 2], ["#AA151B", 1]] },
  BE: { dir: "v", bands: [["#000"], ["#FDDA24"], ["#EF3340"]] },
  FR: { dir: "v", bands: [["#002395"], ["#FFFFFF"], ["#ED2939"]] },
  IT: { dir: "v", bands: [["#009246"], ["#FFFFFF"], ["#CE2B37"]] },
  RO: { dir: "v", bands: [["#002B7F"], ["#FCD116"], ["#CE1126"]] },
};

const W = 21;
const H = 15;

export function Flag({ code, size = 21, className }: { code: string; size?: number; className?: string }) {
  const f = FLAGS[code.toUpperCase()];
  const id = `flag-${code}`;
  const height = Math.round((size * H) / W);
  let rects: React.ReactNode = null;
  if (f) {
    const total = f.bands.reduce((n, [, w = 1]) => n + w, 0);
    let at = 0;
    rects = f.bands.map(([color, w = 1], i) => {
      const len = ((f.dir === "h" ? H : W) * w) / total;
      const r =
        f.dir === "h" ? (
          <rect key={i} x={0} y={at} width={W} height={len + 0.01} fill={color} />
        ) : (
          <rect key={i} x={at} y={0} width={len + 0.01} height={H} fill={color} />
        );
      at += len;
      return r;
    });
  }
  return (
    <svg className={className} width={size} height={height} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" style={{ display: "block", flex: "none" }}>
      <defs>
        <clipPath id={id}>
          <rect width={W} height={H} rx={2.5} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        {rects ?? (
          <>
            <rect width={W} height={H} fill="#E6EAF0" />
            <text x={W / 2} y={H / 2 + 2.6} textAnchor="middle" fontSize={7.5} fontWeight={600} fontFamily="system-ui, sans-serif" fill="#3F5170">
              {code.toUpperCase()}
            </text>
          </>
        )}
      </g>
      <rect x={0.25} y={0.25} width={W - 0.5} height={H - 0.5} rx={2.3} fill="none" stroke="rgba(0,0,0,.18)" strokeWidth={0.5} />
    </svg>
  );
}
