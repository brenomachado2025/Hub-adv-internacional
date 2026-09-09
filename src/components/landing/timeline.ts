export const SCENES = [
  "space",
  "worldToBrazil",
  "connection",
  "problem",
  "hubBirth",
  "solutions",
  "tech",
  "results",
  "map",
  "history",
  "founders",
  "vision",
  "manifesto",
  "future",
  "conversion",
  "finale",
] as const;

export type SceneId = (typeof SCENES)[number];

// Relative weight of each scene, used only as a fallback (server render /
// first paint, before `updateRangesFromDOM` has measured real layout).
const SCENE_WEIGHT: Record<SceneId, number> = {
  space: 140,
  worldToBrazil: 130,
  connection: 120,
  problem: 140,
  hubBirth: 110,
  solutions: 190,
  tech: 120,
  results: 130,
  map: 120,
  history: 140,
  founders: 130,
  vision: 110,
  manifesto: 150,
  future: 100,
  conversion: 130,
  finale: 120,
};

const TOTAL_WEIGHT = Object.values(SCENE_WEIGHT).reduce((a, b) => a + b, 0);

function buildFallbackRanges(): Record<SceneId, { start: number; end: number }> {
  let cursor = 0;
  const out = {} as Record<SceneId, { start: number; end: number }>;
  for (const id of SCENES) {
    const start = cursor / TOTAL_WEIGHT;
    cursor += SCENE_WEIGHT[id];
    const end = cursor / TOTAL_WEIGHT;
    out[id] = { start, end };
  }
  return out;
}

// Mutated in place by `updateRangesFromDOM` once real section heights are
// known, so every consumer (which reads `.start`/`.end` live, never
// destructures once) picks up accurate boundaries without re-importing.
export const RANGES: Record<SceneId, { start: number; end: number }> = buildFallbackRanges();

/**
 * Sections render arbitrary amounts of copy, so their real height rarely
 * matches the vh budget above. Measure each `[data-scene]` element's actual
 * position in the document and derive scroll-progress ranges from that,
 * matching what the user actually sees at each scrollY.
 */
export function updateRangesFromDOM() {
  if (typeof document === "undefined") return;
  const total = document.documentElement.scrollHeight - window.innerHeight;
  if (total <= 0) return;

  for (const id of SCENES) {
    const el = document.querySelector<HTMLElement>(`[data-scene="${id}"]`);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const bottom = top + rect.height;
    const start = clamp01(top / total);
    const end = clamp01((bottom - window.innerHeight) / total);
    RANGES[id].start = Math.min(start, end);
    RANGES[id].end = Math.max(start, end);
  }
}

export function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

/** Maps global progress `p` into a local 0..1 range for [start, end], clamped. */
export function localProgress(p: number, start: number, end: number) {
  if (end <= start) return p >= end ? 1 : 0;
  return clamp01((p - start) / (end - start));
}

export function sceneLocalProgress(p: number, id: SceneId) {
  const { start, end } = RANGES[id];
  return localProgress(p, start, end);
}

export function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

const BRAZIL_ROT = -1.18;

// A single continuous camera/earth timeline. Each stop is a moment in the
// global scroll progress (0..1); we linearly interpolate between the
// surrounding pair every frame. Keeping this as one flat list (instead of a
// big if/else per scene) keeps every transition automatically smooth. Built
// fresh on every call since RANGES can be updated at runtime (see above).
function buildEarthStops() {
  return [
    { p: 0, opacity: 1, camZ: 9, camY: 0, rotY: 0.4, scale: 1 },
    { p: RANGES.space.end, opacity: 1, camZ: 9, camY: 0, rotY: 0.75, scale: 1 },
    { p: RANGES.worldToBrazil.end, opacity: 1, camZ: 2.5, camY: 0.05, rotY: BRAZIL_ROT, scale: 1.2 },
    { p: RANGES.connection.end, opacity: 1, camZ: 3.6, camY: 0.1, rotY: BRAZIL_ROT + 0.2, scale: 1.05 },
    { p: RANGES.problem.start + 0.015, opacity: 0, camZ: 11, camY: 0, rotY: BRAZIL_ROT + 0.4, scale: 0.8 },
    // Camera dollies back in (Earth stays hidden) so the HUB core reads as
    // the focal point while it's born and the solutions orbit around it.
    { p: RANGES.hubBirth.start + 0.02, opacity: 0, camZ: 4.6, camY: 0, rotY: BRAZIL_ROT + 0.4, scale: 0.8 },
    { p: RANGES.solutions.end - 0.02, opacity: 0, camZ: 4.6, camY: 0, rotY: BRAZIL_ROT + 0.6, scale: 0.8 },
    { p: RANGES.tech.start + 0.02, opacity: 0, camZ: 11, camY: 0, rotY: BRAZIL_ROT + 0.4, scale: 0.8 },
    { p: RANGES.map.start, opacity: 0, camZ: 11, camY: 0, rotY: BRAZIL_ROT + 0.4, scale: 0.8 },
    {
      p: lerp(RANGES.map.start, RANGES.map.end, 0.55),
      opacity: 0.95,
      camZ: 5.4,
      camY: -0.1,
      rotY: BRAZIL_ROT + 1.3,
      scale: 1,
    },
    { p: RANGES.map.end, opacity: 0.95, camZ: 5.4, camY: -0.1, rotY: BRAZIL_ROT + 1.7, scale: 1 },
    { p: RANGES.map.end + 0.015, opacity: 0, camZ: 11, camY: 0, rotY: BRAZIL_ROT + 1.9, scale: 0.85 },
    { p: RANGES.vision.start, opacity: 0, camZ: 11, camY: 0, rotY: BRAZIL_ROT + 1.9, scale: 0.85 },
    {
      p: lerp(RANGES.vision.start, RANGES.vision.end, 0.5),
      opacity: 0.85,
      camZ: 4.6,
      camY: 0,
      rotY: BRAZIL_ROT + 2.5,
      scale: 1,
    },
    { p: RANGES.vision.end, opacity: 0.85, camZ: 4.6, camY: 0, rotY: BRAZIL_ROT + 2.9, scale: 1 },
    { p: RANGES.vision.end + 0.012, opacity: 0, camZ: 11, camY: 0, rotY: BRAZIL_ROT + 3, scale: 0.85 },
    { p: RANGES.finale.start + 0.1, opacity: 0, camZ: 11, camY: 0, rotY: BRAZIL_ROT + 3, scale: 0.85 },
    {
      p: RANGES.finale.start + 0.35,
      opacity: 1,
      camZ: 6.2,
      camY: 0.05,
      rotY: BRAZIL_ROT + 3.6,
      scale: 0.9,
    },
    { p: 1, opacity: 1, camZ: 8.6, camY: 0.1, rotY: BRAZIL_ROT + 4, scale: 0.9 },
  ];
}

export type MapLocation = { id: string; lat: number; lng: number; label: string };

// A Brazilian company's real footprint: home market plus the two places it
// most plausibly expands to next. Calibration offset below corrects for
// BRAZIL_ROT being tuned by eye rather than derived from this formula.
export const MAP_LOCATIONS: MapLocation[] = [
  { id: "br", lat: -23.55, lng: -46.63, label: "BRASIL" },
  { id: "us", lat: 25.76, lng: -80.19, label: "ESTADOS UNIDOS" },
  { id: "pt", lat: 38.72, lng: -9.14, label: "PORTUGAL" },
];

const LONGITUDE_CALIBRATION = 0;

export function latLngToVector3(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180 + LONGITUDE_CALIBRATION) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return [x, y, z] as [number, number, number];
}

/** Reveal curve for the map scene's location pins + connecting arcs. */
export function sampleMapPins(p: number) {
  const local = sceneLocalProgress(p, "map");
  return clamp01((local - 0.15) / 0.55);
}

/** Shared growth/reveal curve for the HUB core across the birth + solutions scenes. */
export function sampleHub(p: number) {
  const birthLocal = sceneLocalProgress(p, "hubBirth");
  const solutionsLocal = sceneLocalProgress(p, "solutions");
  const showSolutions = solutionsLocal > 0.02;
  const growth = clamp01(Math.max(birthLocal, showSolutions ? 1 : 0));
  const reveal = showSolutions
    ? clamp01((solutionsLocal - 0.05) / 0.6)
    : clamp01((birthLocal - 0.6) / 0.35);
  const fadeOut = solutionsLocal > 0.92 ? clamp01(1 - (solutionsLocal - 0.92) / 0.08) : 1;
  return { growth: growth * fadeOut, reveal: reveal * fadeOut, showSolutions };
}

export function sampleEarthStops(p: number) {
  const stops = buildEarthStops();
  let a = stops[0];
  let b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (p >= stops[i].p && p <= stops[i + 1].p) {
      a = stops[i];
      b = stops[i + 1];
      break;
    }
  }
  const span = b.p - a.p;
  const t = span > 0 ? clamp01((p - a.p) / span) : 0;
  return {
    opacity: lerp(a.opacity, b.opacity, t),
    camZ: lerp(a.camZ, b.camZ, t),
    camY: lerp(a.camY, b.camY, t),
    rotY: lerp(a.rotY, b.rotY, t),
    scale: lerp(a.scale, b.scale, t),
  };
}
