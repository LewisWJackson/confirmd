/**
 * Programmatic story image generator.
 *
 * Ancient Greece meets newspaper editorial — bold classical shapes,
 * columns, laurel arcs, meander borders, halftone textures.
 * Each story gets a unique, deterministic image.
 */

// ── Hash + PRNG ──────────────────────────────────────────────────────

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Category palettes ────────────────────────────────────────────────

interface Palette {
  ink: string;        // primary bold shape color
  gold: string;       // accent / classical gold
  line: string;       // thin strokes, borders
  paper: string;      // warm bg tint
  bg: string;         // dark base
}

const PALETTES: Record<string, Palette> = {
  bitcoin:      { ink: "#F7931A", gold: "#C4A97D", line: "#D4A14A", paper: "#1c1710", bg: "#131008" },
  ethereum:     { ink: "#627EEA", gold: "#C4A97D", line: "#7B8EC8", paper: "#13141c", bg: "#0c0d14" },
  defi:         { ink: "#10B981", gold: "#C4A97D", line: "#3DAF8A", paper: "#101c16", bg: "#0a140f" },
  regulation:   { ink: "#3B82F6", gold: "#C4A97D", line: "#5B8FD0", paper: "#10141c", bg: "#0a0e14" },
  security:     { ink: "#EF4444", gold: "#C4A97D", line: "#C75050", paper: "#1c1010", bg: "#140a0a" },
  markets:      { ink: "#C4A97D", gold: "#E8D5B5", line: "#B09468", paper: "#1c1810", bg: "#14120c" },
  nfts:         { ink: "#EC4899", gold: "#C4A97D", line: "#D06090", paper: "#1c1018", bg: "#140a10" },
  stablecoins:  { ink: "#14B8A6", gold: "#C4A97D", line: "#3AA898", paper: "#101c1a", bg: "#0a1412" },
  technology:   { ink: "#6366F1", gold: "#C4A97D", line: "#7B7DC8", paper: "#14141c", bg: "#0c0c14" },
  default:      { ink: "#C4A97D", gold: "#E8D5B5", line: "#9A8A6A", paper: "#1a1814", bg: "#12100c" },
};

function getPalette(category: string | null | undefined): Palette {
  if (!category) return PALETTES.default;
  const key = category.toLowerCase().replace(/[^a-z]/g, "");
  return PALETTES[key] || PALETTES.default;
}

// ── Classical shape generators ───────────────────────────────────────

/** Doric column silhouette */
function column(rand: () => number, p: Palette, w: number, h: number): string {
  const x = w * (0.1 + rand() * 0.8);
  const colW = 24 + rand() * 40;
  const colH = h * (0.4 + rand() * 0.45);
  const y = h - colH - (rand() * h * 0.05);
  const capW = colW * 1.4;
  const capH = colW * 0.22;
  const baseW = colW * 1.3;
  const baseH = colW * 0.15;
  const opacity = 0.08 + rand() * 0.12;
  const color = rand() > 0.5 ? p.ink : p.gold;

  // Fluting lines
  const flutes: string[] = [];
  const fluteCount = 3 + Math.floor(rand() * 3);
  for (let i = 1; i < fluteCount; i++) {
    const fx = x - colW / 2 + (colW * i) / fluteCount;
    flutes.push(`<line x1="${fx.toFixed(1)}" y1="${(y + capH).toFixed(1)}" x2="${fx.toFixed(1)}" y2="${(y + colH - baseH).toFixed(1)}" stroke="${p.bg}" stroke-width="1.5" opacity="${(opacity * 0.6).toFixed(2)}" />`);
  }

  return `<g opacity="${opacity.toFixed(2)}">
    <rect x="${(x - capW / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${capW.toFixed(1)}" height="${capH.toFixed(1)}" fill="${color}" />
    <rect x="${(x - colW / 2).toFixed(1)}" y="${(y + capH).toFixed(1)}" width="${colW.toFixed(1)}" height="${(colH - capH - baseH).toFixed(1)}" fill="${color}" />
    <rect x="${(x - baseW / 2).toFixed(1)}" y="${(y + colH - baseH).toFixed(1)}" width="${baseW.toFixed(1)}" height="${baseH.toFixed(1)}" fill="${color}" />
    ${flutes.join("\n    ")}
  </g>`;
}

/** Laurel arc — semicircular leaf pattern */
function laurelArc(rand: () => number, p: Palette, w: number, h: number): string {
  const cx = w * (0.2 + rand() * 0.6);
  const cy = h * (0.2 + rand() * 0.6);
  const r = 60 + rand() * 140;
  const startAngle = -Math.PI * (0.1 + rand() * 0.3);
  const endAngle = -Math.PI + Math.PI * (0.1 + rand() * 0.3);
  const leaves = 6 + Math.floor(rand() * 8);
  const opacity = 0.06 + rand() * 0.1;
  const flip = rand() > 0.5 ? 1 : -1;

  const parts: string[] = [];
  for (let i = 0; i <= leaves; i++) {
    const t = i / leaves;
    const angle = startAngle + (endAngle - startAngle) * t;
    const lx = cx + Math.cos(angle) * r;
    const ly = cy + Math.sin(angle) * r * flip;
    const leafAngle = angle * (180 / Math.PI) + 90 * flip;
    const leafSize = 6 + rand() * 8;
    parts.push(
      `<ellipse cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" rx="${(leafSize * 0.4).toFixed(1)}" ry="${leafSize.toFixed(1)}" fill="${p.gold}" transform="rotate(${leafAngle.toFixed(1)} ${lx.toFixed(1)} ${ly.toFixed(1)})" />`,
    );
  }

  return `<g opacity="${opacity.toFixed(2)}">${parts.join("")}</g>`;
}

/** Greek key / meander border segment */
function meanderBorder(rand: () => number, p: Palette, w: number, h: number): string {
  const isHorizontal = rand() > 0.4;
  const y = isHorizontal ? h * (0.15 + rand() * 0.7) : 0;
  const x = isHorizontal ? 0 : w * (0.15 + rand() * 0.7);
  const len = isHorizontal ? w : h;
  const step = 16 + Math.floor(rand() * 10);
  const opacity = 0.05 + rand() * 0.08;

  const parts: string[] = [];
  const count = Math.floor(len / (step * 4));
  for (let i = 0; i < count; i++) {
    const ox = isHorizontal ? i * step * 4 : x;
    const oy = isHorizontal ? y : i * step * 4;
    if (isHorizontal) {
      parts.push(
        `<path d="M ${ox} ${oy} h ${step} v ${step} h ${-step} v ${step} h ${step * 2} v ${-step * 2} h ${step} v ${step * 2} h ${step}" fill="none" stroke="${p.line}" stroke-width="1.5" />`,
      );
    } else {
      parts.push(
        `<path d="M ${ox} ${oy} v ${step} h ${step} v ${-step} h ${step} v ${step * 2} h ${-step * 2} v ${step} h ${step * 2} v ${step}" fill="none" stroke="${p.line}" stroke-width="1.5" />`,
      );
    }
  }

  return `<g opacity="${opacity.toFixed(2)}">${parts.join("")}</g>`;
}

/** Bold triangle / pediment */
function pediment(rand: () => number, p: Palette, w: number, h: number): string {
  const cx = w * (0.15 + rand() * 0.7);
  const baseY = h * (0.3 + rand() * 0.5);
  const baseW = 120 + rand() * 300;
  const peakH = 60 + rand() * 150;
  const opacity = 0.06 + rand() * 0.12;
  const color = rand() > 0.6 ? p.ink : p.gold;
  const filled = rand() > 0.4;

  const x1 = cx - baseW / 2;
  const x2 = cx + baseW / 2;

  if (filled) {
    return `<polygon points="${cx.toFixed(1)},${(baseY - peakH).toFixed(1)} ${x1.toFixed(1)},${baseY.toFixed(1)} ${x2.toFixed(1)},${baseY.toFixed(1)}" fill="${color}" opacity="${opacity.toFixed(2)}" />`;
  }
  return `<polygon points="${cx.toFixed(1)},${(baseY - peakH).toFixed(1)} ${x1.toFixed(1)},${baseY.toFixed(1)} ${x2.toFixed(1)},${baseY.toFixed(1)}" fill="none" stroke="${color}" stroke-width="${(2 + rand() * 4).toFixed(1)}" opacity="${opacity.toFixed(2)}" />`;
}

/** Bold circle — medallion / seal */
function medallion(rand: () => number, p: Palette, w: number, h: number): string {
  const cx = w * (0.15 + rand() * 0.7);
  const cy = h * (0.15 + rand() * 0.7);
  const r = 50 + rand() * 160;
  const opacity = 0.06 + rand() * 0.12;
  const strokeW = 2 + rand() * 5;
  const color = rand() > 0.5 ? p.ink : p.gold;
  const filled = rand() > 0.6;

  let inner = "";
  if (!filled && rand() > 0.4) {
    inner = `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r * 0.75).toFixed(1)}" fill="none" stroke="${color}" stroke-width="${(strokeW * 0.6).toFixed(1)}" opacity="${(opacity * 0.7).toFixed(2)}" />`;
  }

  if (filled) {
    return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}" opacity="${(opacity * 0.5).toFixed(2)}" />${inner}`;
  }
  return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="none" stroke="${color}" stroke-width="${strokeW.toFixed(1)}" opacity="${opacity.toFixed(2)}" />${inner}`;
}

/** Newspaper-style halftone dot cluster */
function halftone(rand: () => number, p: Palette, w: number, h: number): string {
  const startX = rand() * w;
  const startY = rand() * h;
  const gridW = 80 + rand() * 200;
  const gridH = 60 + rand() * 150;
  const spacing = 8 + rand() * 6;
  const maxR = 2 + rand() * 3;
  const opacity = 0.04 + rand() * 0.08;
  const color = rand() > 0.6 ? p.ink : p.line;

  const dots: string[] = [];
  for (let dx = 0; dx < gridW; dx += spacing) {
    for (let dy = 0; dy < gridH; dy += spacing) {
      const dist = Math.sqrt(
        Math.pow((dx / gridW - 0.5) * 2, 2) +
        Math.pow((dy / gridH - 0.5) * 2, 2),
      );
      const r = maxR * (1 - dist * 0.7) * (0.5 + rand() * 0.5);
      if (r > 0.5) {
        dots.push(
          `<circle cx="${(startX + dx).toFixed(1)}" cy="${(startY + dy).toFixed(1)}" r="${r.toFixed(1)}" />`,
        );
      }
    }
  }

  return `<g fill="${color}" opacity="${opacity.toFixed(2)}">${dots.join("")}</g>`;
}

/** Bold diagonal stripe / slash */
function boldStripe(rand: () => number, p: Palette, w: number, h: number): string {
  const x1 = rand() * w;
  const y1 = rand() * h * 0.3;
  const x2 = x1 + (rand() - 0.5) * w * 0.8;
  const y2 = y1 + h * (0.4 + rand() * 0.5);
  const strokeW = 8 + rand() * 40;
  const opacity = 0.04 + rand() * 0.08;
  const color = rand() > 0.5 ? p.ink : p.gold;

  return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="${strokeW.toFixed(1)}" opacity="${opacity.toFixed(2)}" stroke-linecap="butt" />`;
}

/** Thick editorial rule line */
function editorialRule(rand: () => number, p: Palette, w: number, h: number): string {
  const isDouble = rand() > 0.6;
  const y = h * (0.1 + rand() * 0.8);
  const x1 = rand() * w * 0.3;
  const x2 = w * (0.5 + rand() * 0.5);
  const opacity = 0.06 + rand() * 0.1;

  let svg = `<line x1="${x1.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${p.line}" stroke-width="2.5" opacity="${opacity.toFixed(2)}" />`;
  if (isDouble) {
    svg += `\n    <line x1="${x1.toFixed(1)}" y1="${(y + 6).toFixed(1)}" x2="${x2.toFixed(1)}" y2="${(y + 6).toFixed(1)}" stroke="${p.line}" stroke-width="0.8" opacity="${(opacity * 0.7).toFixed(2)}" />`;
  }
  return svg;
}

/** Bold rectangular block */
function boldBlock(rand: () => number, p: Palette, w: number, h: number): string {
  const bw = 60 + rand() * 250;
  const bh = 40 + rand() * 180;
  const x = rand() * (w - bw);
  const y = rand() * (h - bh);
  const opacity = 0.04 + rand() * 0.1;
  const color = rand() > 0.5 ? p.ink : p.gold;

  return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="${color}" opacity="${opacity.toFixed(2)}" />`;
}

// ── Parchment texture ────────────────────────────────────────────────

function parchmentNoise(rand: () => number, p: Palette, w: number, h: number): string {
  const dots: string[] = [];
  const count = 40 + Math.floor(rand() * 30);
  for (let i = 0; i < count; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = 20 + rand() * 80;
    const opacity = 0.01 + rand() * 0.03;
    dots.push(
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${rand() > 0.5 ? p.paper : p.gold}" opacity="${opacity.toFixed(3)}" />`,
    );
  }
  return dots.join("\n    ");
}

// ── Main generator ───────────────────────────────────────────────────

export interface StoryImageParams {
  id: string;
  title: string;
  category?: string | null;
  assetSymbols?: string[];
}

export function generateStoryImage(
  params: StoryImageParams,
  width = 1200,
  height = 675,
): string {
  const seed = hashString(params.id + (params.title || ""));
  const rand = seededRandom(seed);
  const p = getPalette(params.category);

  // Pick which classical elements appear (variety per story)
  const elements: string[] = [];

  // Always include: 1-2 columns, 1 meander border, some halftone
  const colCount = 1 + Math.floor(rand() * 3); // 1-3 columns
  for (let i = 0; i < colCount; i++) elements.push(column(rand, p, width, height));

  // Meander border (60% chance)
  if (rand() > 0.4) elements.push(meanderBorder(rand, p, width, height));

  // Bold shapes — pediments and blocks
  const boldCount = 1 + Math.floor(rand() * 3);
  for (let i = 0; i < boldCount; i++) {
    if (rand() > 0.5) {
      elements.push(pediment(rand, p, width, height));
    } else {
      elements.push(boldBlock(rand, p, width, height));
    }
  }

  // Medallion (70% chance)
  if (rand() > 0.3) elements.push(medallion(rand, p, width, height));

  // Laurel arc (60% chance)
  if (rand() > 0.4) elements.push(laurelArc(rand, p, width, height));

  // Bold diagonal stripes (1-2)
  const stripeCount = Math.floor(rand() * 3);
  for (let i = 0; i < stripeCount; i++) elements.push(boldStripe(rand, p, width, height));

  // Editorial rule lines (1-3)
  const ruleCount = 1 + Math.floor(rand() * 3);
  for (let i = 0; i < ruleCount; i++) elements.push(editorialRule(rand, p, width, height));

  // Halftone clusters (1-2)
  const htCount = 1 + Math.floor(rand() * 2);
  for (let i = 0; i < htCount; i++) elements.push(halftone(rand, p, width, height));

  // Category label
  const categoryLabel = params.category ? escapeXml(params.category.toUpperCase()) : "";
  const assets = params.assetSymbols?.slice(0, 3) || [];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${p.bg}" />
      <stop offset="100%" stop-color="${p.paper}" />
    </linearGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="white" stop-opacity="0" />
      <stop offset="100%" stop-color="black" stop-opacity="0.4" />
    </radialGradient>
    <linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="black" stop-opacity="0" />
      <stop offset="100%" stop-color="black" stop-opacity="0.55" />
    </linearGradient>
  </defs>

  <!-- Dark warm background -->
  <rect width="${width}" height="${height}" fill="url(#bg)" />

  <!-- Parchment texture -->
  <g>
    ${parchmentNoise(rand, p, width, height)}
  </g>

  <!-- Classical elements -->
  <g>
    ${elements.join("\n    ")}
  </g>

  <!-- Vignette overlay -->
  <rect width="${width}" height="${height}" fill="url(#vignette)" />

  <!-- Bottom fade for text -->
  <rect x="0" y="${height - 130}" width="${width}" height="130" fill="url(#bottomFade)" />

  <!-- Thin top editorial rule -->
  <line x1="48" y1="40" x2="${width - 48}" y2="40" stroke="${p.gold}" stroke-width="1.5" opacity="0.2" />
  <line x1="48" y1="44" x2="${width - 48}" y2="44" stroke="${p.gold}" stroke-width="0.5" opacity="0.12" />

  <!-- Category label -->
  ${categoryLabel ? `<text x="48" y="${height - 44}" font-family="Georgia, 'Times New Roman', serif" font-size="13" font-weight="700" fill="${p.gold}" letter-spacing="3" opacity="0.7">${categoryLabel}</text>` : ""}

  <!-- Asset symbols -->
  ${assets.map((sym, i) => `<g>
    <rect x="${48 + i * 52}" y="${height - 72}" width="44" height="20" rx="3" fill="${p.gold}" opacity="0.15" />
    <text x="${48 + i * 52 + 22}" y="${height - 58}" font-family="Georgia, 'Times New Roman', serif" font-size="10" font-weight="700" fill="${p.gold}" text-anchor="middle" opacity="0.6">${escapeXml(sym)}</text>
  </g>`).join("\n  ")}

  <!-- CONFIRMD watermark -->
  <text x="${width - 48}" y="${height - 28}" font-family="Georgia, 'Times New Roman', serif" font-size="9" font-weight="400" fill="${p.gold}" opacity="0.12" text-anchor="end" letter-spacing="4">CONFIRMD</text>
</svg>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
