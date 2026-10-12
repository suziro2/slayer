/**
 * Smooth 2D character renderer for the battle canvas.
 *
 * Every class has its own silhouette so heroes read instantly at a glance:
 *   - build: standard (swordsman) / slim (archer, assassin) / heavy (guardian,
 *            paladin, warrior) / robe (mage, druid, sorcerer)
 *   - gear:  quiver, spellbook, dualWield, shield, furPauldrons, flameAura,
 *            vines, emblemCape, wings, ribs, torn
 * Shapes: humanoid, knight (heavy brute), beast, spider, wisp, dragon, treant.
 * Hand-drawn vector shapes with gradients, soft shading and glow — never
 * pixelated, never stretched (all drawing is proportional to one unit scale).
 */

export type BodyShape = "humanoid" | "beast" | "spider" | "wisp" | "dragon" | "treant" | "knight";
export type Headgear = "helm" | "hood" | "hat" | "crown" | "horns" | "antlers" | "headband" | "none";
export type WeaponKind =
  | "sword" | "greatsword" | "bow" | "staff" | "axe" | "hammer" | "dagger" | "orb" | "claw" | "none";
export type BodyBuild = "standard" | "slim" | "heavy" | "robe";
export type Gear =
  | "quiver" | "spellbook" | "dualWield" | "shield" | "furPauldrons"
  | "flameAura" | "vines" | "emblemCape" | "wings" | "ribs" | "torn";

export type { PixelChibiDef } from "./pixelChibi";
import { drawChibi, type PixelChibiDef } from "./pixelChibi";

export interface SpriteColors {
  skin: string;
  hair: string;
  armor: string;
  accent: string;
  cape: string;
  weapon: string;
  dark: string;
}

export interface SpriteKit {
  shape: BodyShape;
  headgear: Headgear;
  weapon: WeaponKind;
  colors: SpriteColors;
  scale: number; // 5 = hero pixel size (1 canvas px per sprite pixel)
  shield?: boolean; // legacy flag, treated as gear "shield"
  build?: BodyBuild;
  gear?: Gear[];
  /** genuine pixel-art chibi definition (Soul Knight style); takes priority over vector rendering */
  pixel?: PixelChibiDef;
}

export interface PortraitCrop {
  u: number; // normalized face center-x in the source image
  v: number; // normalized face center-y
  r: number; // normalized crop radius (relative to image width)
}

export interface DrawOpts {
  x: number;
  y: number; // ground / feet position
  facingLeft: boolean;
  frame: number;
  moving: boolean;
  attackT: number; // 0..1
  hitFlash: number;
  dead?: boolean;
  elite?: boolean;
  boss?: boolean;
  casting?: boolean;
  /** real character artwork drawn as the head/face so the battle sprite matches its portrait */
  portrait?: HTMLImageElement | null;
  portraitCrop?: PortraitCrop;
  /** 0 = just died, 1 = fully collapsed (dies animation) */
  deathProgress?: number;
  /** dashing: draws speed streaks behind the chibi */
  dashing?: boolean;
}

/**
 * Draws the character's actual portrait artwork as a circular head medallion.
 * Uses a cover-fit crop so the art is never stretched or squashed, adds a soft
 * class-coloured ring, and flashes white on hit.
 */
function drawPortraitFace(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  radius: number,
  crop: PortraitCrop,
  ringColor: string,
  flash: boolean,
  glow: number
) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;

  // cover-fit: source square crop -> destination circle box
  const srcSize = Math.min(iw, ih) * crop.r * 2;
  const sx = Math.max(0, Math.min(iw - srcSize, iw * crop.u - srcSize / 2));
  const sy = Math.max(0, Math.min(ih - srcSize, ih * crop.v - srcSize / 2));
  const dx = cx - radius;
  const dy = cy - radius;
  const d = radius * 2;

  ctx.save();

  // glow behind head
  if (glow > 0) {
    const g = ctx.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius * 1.9);
    g.addColorStop(0, withAlpha(ringColor, 0.35 * glow));
    g.addColorStop(1, withAlpha(ringColor, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.9, 0, Math.PI * 2);
    ctx.fill();
  }

  // clipped artwork
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.save();
  ctx.clip();
  ctx.drawImage(img, sx, sy, srcSize, srcSize, dx, dy, d, d);
  if (flash) {
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(dx, dy, d, d);
    ctx.globalAlpha = 1;
  }
  // subtle bottom shading so the head sits on the body
  const sh = ctx.createLinearGradient(cx, cy - radius, cx, cy + radius);
  sh.addColorStop(0.6, "rgba(0,0,0,0)");
  sh.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = sh;
  ctx.fillRect(dx, dy, d, d);
  ctx.restore();

  // ring
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = Math.max(1.6, radius * 0.14);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.lineWidth = Math.max(1, radius * 0.07);
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 1.06, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function withAlpha(hex: string, a: number) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (full.length < 6) return `rgba(255,255,255,${a})`;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function shade(hex: string, amt: number) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return hex;
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amt));
  return `rgb(${r},${g},${b})`;
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function groundShadow(ctx: CanvasRenderingContext2D, w: number) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.42)";
  ctx.beginPath();
  ctx.ellipse(0, 0, w, w * 0.33, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function aura(ctx: CanvasRenderingContext2D, color: string, radius: number, pulse: number) {
  const g = ctx.createRadialGradient(0, -radius * 0.5, radius * 0.12, 0, -radius * 0.5, radius);
  g.addColorStop(0, withAlpha(color, 0.3 + pulse * 0.18));
  g.addColorStop(1, withAlpha(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, -radius * 0.5, radius, 0, Math.PI * 2);
  ctx.fill();
}

function slashFx(ctx: CanvasRenderingContext2D, u: number, color: string, t: number, mirror = false) {
  const a = Math.max(0, Math.min(1, t));
  ctx.save();
  if (mirror) ctx.scale(-1, 1);
  ctx.globalAlpha = 1 - a * 0.75;
  ctx.strokeStyle = color;
  ctx.lineWidth = 5 * u * (1 - a * 0.4);
  ctx.lineCap = "round";
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.arc(6 * u, -24 * u, 28 * u, -1.15 + a * 1.5, 0.55 + a * 1.5);
  ctx.stroke();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.8 * u;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(6 * u, -24 * u, 28 * u, -1.0 + a * 1.5, 0.4 + a * 1.5);
  ctx.stroke();
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Weapons                                                             */
/* ------------------------------------------------------------------ */

function drawWeapon(
  ctx: CanvasRenderingContext2D,
  kind: WeaponKind,
  c: SpriteColors,
  u: number,
  swing: number,
  flash: boolean,
  drawingBow: boolean
) {
  const col = flash ? "#ffffff" : c.weapon;
  const acc = flash ? "#ffffff" : c.accent;
  ctx.save();
  ctx.translate(13 * u, -32 * u);
  ctx.rotate(swing);
  ctx.shadowColor = col;
  ctx.shadowBlur = 10;

  switch (kind) {
    case "sword": {
      ctx.fillStyle = acc;
      rr(ctx, -4 * u, -2 * u, 10 * u, 3 * u, 1.4 * u);
      ctx.fill();
      const g = ctx.createLinearGradient(0, -32 * u, 4 * u, 0);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.5, col);
      g.addColorStop(1, shade(col, -40));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-1.7 * u, -2 * u);
      ctx.lineTo(1.7 * u, -2 * u);
      ctx.lineTo(1.2 * u, -30 * u);
      ctx.lineTo(0, -34 * u);
      ctx.lineTo(-1.2 * u, -30 * u);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "greatsword": {
      ctx.fillStyle = acc;
      rr(ctx, -7 * u, -2 * u, 15 * u, 3.6 * u, 1.6 * u);
      ctx.fill();
      const g = ctx.createLinearGradient(0, -48 * u, 7 * u, 0);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.45, col);
      g.addColorStop(1, shade(col, -50));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-3.6 * u, -2 * u);
      ctx.lineTo(3.6 * u, -2 * u);
      ctx.lineTo(2.7 * u, -42 * u);
      ctx.lineTo(0, -49 * u);
      ctx.lineTo(-2.7 * u, -42 * u);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 0.9 * u;
      ctx.beginPath();
      ctx.moveTo(0, -4 * u);
      ctx.lineTo(0, -44 * u);
      ctx.stroke();
      break;
    }
    case "dagger": {
      ctx.fillStyle = acc;
      rr(ctx, -3.4 * u, -1.8 * u, 9 * u, 2.6 * u, 1.2 * u);
      ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(-1.4 * u, -1.8 * u);
      ctx.lineTo(1.4 * u, -1.8 * u);
      ctx.lineTo(0.7 * u, -17 * u);
      ctx.lineTo(0, -19 * u);
      ctx.lineTo(-0.7 * u, -17 * u);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "axe": {
      ctx.strokeStyle = "#7c5a2b";
      ctx.lineWidth = 2.6 * u;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 8 * u);
      ctx.lineTo(0, -26 * u);
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, -26 * u);
      ctx.quadraticCurveTo(16 * u, -24 * u, 13 * u, -8 * u);
      ctx.quadraticCurveTo(7 * u, -14 * u, 0, -13 * u);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -26 * u);
      ctx.quadraticCurveTo(-16 * u, -24 * u, -13 * u, -8 * u);
      ctx.quadraticCurveTo(-7 * u, -14 * u, 0, -13 * u);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.moveTo(2 * u, -24 * u);
      ctx.quadraticCurveTo(11 * u, -20 * u, 10 * u, -12 * u);
      ctx.quadraticCurveTo(7 * u, -17 * u, 2 * u, -18 * u);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "hammer": {
      ctx.strokeStyle = "#7c5a2b";
      ctx.lineWidth = 3 * u;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 8 * u);
      ctx.lineTo(0, -24 * u);
      ctx.stroke();
      const g = ctx.createLinearGradient(-10 * u, -36 * u, 10 * u, -20 * u);
      g.addColorStop(0, shade(col, 45));
      g.addColorStop(1, shade(col, -45));
      ctx.fillStyle = g;
      rr(ctx, -10 * u, -36 * u, 20 * u, 14 * u, 3.4 * u);
      ctx.fill();
      ctx.fillStyle = withAlpha(acc, 0.85);
      rr(ctx, -10 * u, -36 * u, 20 * u, 3.6 * u, 1.7 * u);
      ctx.fill();
      break;
    }
    case "bow": {
      // held forward; string pulled while attacking
      const pull = drawingBow ? 5 * u : 0;
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.8 * u;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, -12 * u, 19 * u, -1.2, 1.2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 1 * u;
      ctx.beginPath();
      ctx.moveTo(7.4 * u, -28 * u);
      ctx.lineTo(-pull, -12 * u);
      ctx.lineTo(7.4 * u, 4 * u);
      ctx.stroke();
      if (drawingBow) {
        ctx.strokeStyle = acc;
        ctx.lineWidth = 1.6 * u;
        ctx.beginPath();
        ctx.moveTo(-pull, -12 * u);
        ctx.lineTo(14 * u, -12 * u);
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(14 * u, -12 * u);
        ctx.lineTo(9 * u, -14 * u);
        ctx.lineTo(9 * u, -10 * u);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case "staff": {
      ctx.strokeStyle = "#7c5a2b";
      ctx.lineWidth = 2.6 * u;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 12 * u);
      ctx.lineTo(0, -34 * u);
      ctx.stroke();
      ctx.strokeStyle = withAlpha(acc, 0.8);
      ctx.lineWidth = 1.2 * u;
      ctx.beginPath();
      ctx.moveTo(-3 * u, -30 * u);
      ctx.quadraticCurveTo(0, -38 * u, 3 * u, -30 * u);
      ctx.stroke();
      const g = ctx.createRadialGradient(0, -38 * u, 1, 0, -38 * u, 10 * u);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.4, col);
      g.addColorStop(1, withAlpha(col, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, -38 * u, 10 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(0, -38 * u, 4.4 * u, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "orb": {
      ctx.strokeStyle = "#7c5a2b";
      ctx.lineWidth = 2.6 * u;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 12 * u);
      ctx.lineTo(0, -26 * u);
      ctx.stroke();
      const g = ctx.createRadialGradient(-3 * u, -36 * u, 1, 0, -34 * u, 13 * u);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.35, col);
      g.addColorStop(1, withAlpha(col, 0.04));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, -34 * u, 13 * u, 0, Math.PI * 2);
      ctx.fill();
      // orbiting sparks
      for (let i = 0; i < 3; i++) {
        const a = swing * 2 + (i * Math.PI * 2) / 3;
        ctx.fillStyle = withAlpha("#ffffff", 0.8);
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 11 * u, -34 * u + Math.sin(a) * 5 * u, 1.5 * u, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "claw": {
      ctx.strokeStyle = col;
      ctx.lineWidth = 2 * u;
      ctx.lineCap = "round";
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(7 * u, i * 3.4 * u, 14 * u, i * 5.4 * u - 3 * u);
        ctx.stroke();
      }
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Headgear                                                            */
/* ------------------------------------------------------------------ */

function drawHeadgear(ctx: CanvasRenderingContext2D, kind: Headgear, c: SpriteColors, u: number, flash: boolean, build: BodyBuild) {
  const armor = flash ? "#ffffff" : c.armor;
  const accent = flash ? "#ffffff" : c.accent;
  const cape = flash ? "#ffffff" : c.cape;
  const hy = build === "robe" ? -2 * u : 0;
  ctx.save();
  ctx.translate(0, hy);
  switch (kind) {
    case "helm": {
      const g = ctx.createLinearGradient(0, -62 * u, 0, -44 * u);
      g.addColorStop(0, shade(armor, 55));
      g.addColorStop(1, shade(armor, -30));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-11.5 * u, -44 * u);
      ctx.quadraticCurveTo(-11.5 * u, -64 * u, 0, -64 * u);
      ctx.quadraticCurveTo(11.5 * u, -64 * u, 11.5 * u, -44 * u);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = accent;
      rr(ctx, -11.5 * u, -48 * u, 23 * u, 3.6 * u, 1.7 * u);
      ctx.fill();
      ctx.fillStyle = "rgba(10,10,20,0.6)";
      rr(ctx, -7.5 * u, -55 * u, 15 * u, 2.4 * u, 1.1 * u);
      ctx.fill();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(-1.8 * u, -64 * u);
      ctx.quadraticCurveTo(0, -76 * u, 4 * u, -71 * u);
      ctx.quadraticCurveTo(1.6 * u, -66 * u, 1.8 * u, -63 * u);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "hood": {
      ctx.fillStyle = cape;
      ctx.beginPath();
      ctx.moveTo(-13.5 * u, -38 * u);
      ctx.quadraticCurveTo(-15 * u, -66 * u, 0, -66 * u);
      ctx.quadraticCurveTo(15 * u, -66 * u, 13.5 * u, -38 * u);
      ctx.quadraticCurveTo(6 * u, -47 * u, 0, -47 * u);
      ctx.quadraticCurveTo(-6 * u, -47 * u, -13.5 * u, -38 * u);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.32)";
      ctx.beginPath();
      ctx.ellipse(0, -51 * u, 9.5 * u, 7.5 * u, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "hat": {
      ctx.fillStyle = armor;
      ctx.beginPath();
      ctx.moveTo(-16 * u, -57 * u);
      ctx.quadraticCurveTo(0, -63 * u, 16 * u, -57 * u);
      ctx.quadraticCurveTo(0, -53 * u, -16 * u, -57 * u);
      ctx.closePath();
      ctx.fill();
      const g = ctx.createLinearGradient(0, -82 * u, 0, -57 * u);
      g.addColorStop(0, shade(armor, 45));
      g.addColorStop(1, shade(armor, -25));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-9 * u, -57 * u);
      ctx.quadraticCurveTo(-5 * u, -78 * u, 3 * u, -81 * u);
      ctx.quadraticCurveTo(9 * u, -72 * u, 9 * u, -57 * u);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(3 * u, -81 * u, 2.8 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = withAlpha("#ffffff", 0.25);
      ctx.beginPath();
      ctx.moveTo(-6 * u, -58 * u);
      ctx.quadraticCurveTo(-2 * u, -72 * u, 2 * u, -78 * u);
      ctx.quadraticCurveTo(0, -68 * u, -2 * u, -58 * u);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "crown": {
      ctx.fillStyle = "#f5c542";
      ctx.beginPath();
      ctx.moveTo(-11.5 * u, -57 * u);
      ctx.lineTo(-9.5 * u, -70 * u);
      ctx.lineTo(-4 * u, -61 * u);
      ctx.lineTo(0, -73 * u);
      ctx.lineTo(4 * u, -61 * u);
      ctx.lineTo(9.5 * u, -70 * u);
      ctx.lineTo(11.5 * u, -57 * u);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#b8860b";
      ctx.lineWidth = 0.9 * u;
      ctx.stroke();
      ctx.fillStyle = "#f43f5e";
      ctx.beginPath();
      ctx.arc(0, -59 * u, 1.9 * u, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "horns": {
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(-9 * u, -57 * u);
      ctx.quadraticCurveTo(-20 * u, -63 * u, -16 * u, -78 * u);
      ctx.quadraticCurveTo(-10 * u, -66 * u, -5 * u, -59 * u);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(9 * u, -57 * u);
      ctx.quadraticCurveTo(20 * u, -63 * u, 16 * u, -78 * u);
      ctx.quadraticCurveTo(10 * u, -66 * u, 5 * u, -59 * u);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "antlers": {
      ctx.strokeStyle = "#8b6b3d";
      ctx.lineWidth = 2.4 * u;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-8 * u, -57 * u);
      ctx.quadraticCurveTo(-15 * u, -68 * u, -13 * u, -78 * u);
      ctx.moveTo(-13 * u, -68 * u);
      ctx.quadraticCurveTo(-20 * u, -70 * u, -22 * u, -78 * u);
      ctx.moveTo(8 * u, -57 * u);
      ctx.quadraticCurveTo(15 * u, -68 * u, 13 * u, -78 * u);
      ctx.moveTo(13 * u, -68 * u);
      ctx.quadraticCurveTo(20 * u, -70 * u, 22 * u, -78 * u);
      ctx.stroke();
      // leaves
      ctx.fillStyle = "#4ade80";
      [[-15, -74], [15, -74], [-21, -76], [21, -76]].forEach(([lx, ly]) => {
        ctx.beginPath();
        ctx.ellipse(lx * u, ly * u, 2.4 * u, 1.5 * u, lx < 0 ? -0.5 : 0.5, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }
    case "headband": {
      ctx.fillStyle = accent;
      rr(ctx, -11.5 * u, -57 * u, 23 * u, 3.8 * u, 1.7 * u);
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2.2 * u;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(10 * u, -55 * u);
      ctx.quadraticCurveTo(19 * u, -49 * u, 17 * u, -38 * u);
      ctx.stroke();
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Gear                                                                */
/* ------------------------------------------------------------------ */

function drawBackGear(ctx: CanvasRenderingContext2D, gear: Gear[], c: SpriteColors, u: number, flash: boolean, frame: number) {
  ctx.save();
  if (gear.includes("quiver")) {
    ctx.translate(-11 * u, -40 * u);
    ctx.rotate(-0.35);
    ctx.fillStyle = flash ? "#ffffff" : "#6b4a26";
    rr(ctx, -4 * u, -12 * u, 8 * u, 20 * u, 3 * u);
    ctx.fill();
    ctx.strokeStyle = flash ? "#ffffff" : "#8b6b3d";
    ctx.lineWidth = 1.6 * u;
    ctx.beginPath();
    ctx.moveTo(-3 * u, -6 * u);
    ctx.lineTo(3 * u, -6 * u);
    ctx.stroke();
    // arrows
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1.3 * u;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 2.4 * u, -11 * u);
      ctx.lineTo(i * 3.4 * u, -22 * u);
      ctx.stroke();
    }
    ctx.fillStyle = c.accent;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 3.4 * u, -22 * u);
      ctx.lineTo(i * 3.4 * u - 1.6 * u, -18 * u);
      ctx.lineTo(i * 3.4 * u + 1.6 * u, -18 * u);
      ctx.closePath();
      ctx.fill();
    }
  }
  if (gear.includes("wings")) {
    const flap = Math.sin(frame * 2.2) * 4 * u;
    ctx.fillStyle = flash ? "#ffffff" : withAlpha(c.dark, 0.95);
    [-1, 1].forEach((dir) => {
      ctx.beginPath();
      ctx.moveTo(dir * 8 * u, -44 * u);
      ctx.quadraticCurveTo(dir * 34 * u, -64 * u - flap, dir * 40 * u, -34 * u);
      ctx.quadraticCurveTo(dir * 26 * u, -40 * u, dir * 22 * u, -26 * u);
      ctx.quadraticCurveTo(dir * 14 * u, -32 * u, dir * 8 * u, -30 * u);
      ctx.closePath();
      ctx.fill();
    });
  }
  ctx.restore();
}

function drawFrontGear(ctx: CanvasRenderingContext2D, gear: Gear[], c: SpriteColors, u: number, flash: boolean, frame: number, build: BodyBuild) {
  ctx.save();
  if (gear.includes("spellbook")) {
    const fy = Math.sin(frame * 1.6) * 2.4 * u;
    ctx.translate(-17 * u, -40 * u + fy);
    ctx.rotate(-0.2);
    ctx.fillStyle = flash ? "#ffffff" : shade(c.armor, -20);
    rr(ctx, -6 * u, -5 * u, 12 * u, 10 * u, 1.6 * u);
    ctx.fill();
    ctx.fillStyle = "#f8fafc";
    rr(ctx, -5 * u, -4 * u, 10 * u, 8 * u, 1.2 * u);
    ctx.fill();
    ctx.strokeStyle = withAlpha(c.accent, 0.9);
    ctx.lineWidth = 0.9 * u;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-4 * u, i * 2.4 * u);
      ctx.lineTo(4 * u, i * 2.4 * u);
      ctx.stroke();
    }
    ctx.fillStyle = withAlpha(c.accent, 0.75);
    ctx.beginPath();
    ctx.arc(0, -9 * u, 2 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  if (gear.includes("vines")) {
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 1.8 * u;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-9 * u, -20 * u);
    ctx.quadraticCurveTo(-14 * u, -32 * u, -8 * u, -42 * u);
    ctx.stroke();
    ctx.fillStyle = "#86efac";
    [[-13, -30], [-9, -38], [-12, -24]].forEach(([lx, ly]) => {
      ctx.beginPath();
      ctx.ellipse(lx * u, ly * u, 2.6 * u, 1.5 * u, -0.6, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  if (gear.includes("ribs")) {
    ctx.strokeStyle = "rgba(15,20,32,0.55)";
    ctx.lineWidth = 1.4 * u;
    const top = build === "robe" ? -34 : -38;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-7 * u, (top + i * 5) * u);
      ctx.quadraticCurveTo(0, (top + 3 + i * 5) * u, 7 * u, (top + i * 5) * u);
      ctx.stroke();
    }
  }
  if (gear.includes("torn")) {
    ctx.fillStyle = withAlpha(c.dark, 0.75);
    ctx.beginPath();
    ctx.moveTo(-9 * u, -26 * u);
    ctx.lineTo(-3 * u, -18 * u);
    ctx.lineTo(-7 * u, -14 * u);
    ctx.lineTo(-11 * u, -20 * u);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(6 * u, -30 * u);
    ctx.lineTo(11 * u, -24 * u);
    ctx.lineTo(7 * u, -20 * u);
    ctx.closePath();
    ctx.fill();
  }
  if (gear.includes("furPauldrons")) {
    ctx.fillStyle = flash ? "#ffffff" : "#8b6b3d";
    [-1, 1].forEach((dir) => {
      ctx.beginPath();
      ctx.ellipse(dir * 13 * u, -44 * u, 8 * u, 6.5 * u, dir * 0.3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = flash ? "#ffffff" : "#a9855a";
    [-1, 1].forEach((dir) => {
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(dir * (8 + i * 3) * u, -48 * u);
        ctx.lineTo(dir * (9.5 + i * 3) * u, -42 * u);
        ctx.lineTo(dir * (11 + i * 3) * u, -48 * u);
        ctx.closePath();
        ctx.fill();
      }
    });
  }
  if (gear.includes("emblemCape")) {
    ctx.fillStyle = withAlpha(c.accent, 0.9);
    ctx.beginPath();
    ctx.arc(0, -34 * u, 3.4 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 0.9 * u;
    ctx.stroke();
  }
  if (gear.includes("flameAura")) {
    for (let i = 0; i < 6; i++) {
      const a = frame * 2 + i * 1.05;
      const rx = Math.cos(a) * 18 * u;
      const ry = -20 * u + Math.sin(a * 1.3) * 22 * u;
      const g = ctx.createRadialGradient(rx, ry, 0, rx, ry, 5 * u);
      g.addColorStop(0, "rgba(255,255,255,0.9)");
      g.addColorStop(0.4, withAlpha("#fb923c", 0.75));
      g.addColorStop(1, "rgba(249,115,22,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(rx, ry, 5 * u, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Humanoid (all hero classes + humanoid enemies)                      */
/* ------------------------------------------------------------------ */

function humanoid(ctx: CanvasRenderingContext2D, kit: SpriteKit, o: DrawOpts) {
  const u = kit.scale / 4;
  const c = kit.colors;
  const flash = o.hitFlash > 0;
  const build: BodyBuild = kit.build || (kit.shape === "knight" ? "heavy" : "standard");
  const gear: Gear[] = [...(kit.gear || []), ...(kit.shield ? (["shield"] as Gear[]) : [])];
  const step = Math.sin(o.frame * 1.6);
  const walk = o.moving ? step : Math.sin(o.frame * 0.5) * 0.22;
  const bob = o.moving ? Math.abs(step) * 1.8 * u : Math.sin(o.frame * 0.9) * 0.8 * u;
  const attacking = o.attackT > 0 && o.attackT < 1;
  const swing = attacking ? -1.5 + Math.sin(o.attackT * Math.PI) * 2.4 : -0.22 + walk * 0.06;

  const wide = build === "heavy" ? 1.32 : build === "slim" ? 0.82 : 1;
  const robeTop = -22 * u;

  groundShadow(ctx, (17 + (build === "heavy" ? 5 : 0)) * u);
  aura(ctx, o.boss ? "#f43f5e" : o.elite ? "#fb923c" : c.accent, (build === "heavy" ? 50 : 42) * u, 0.5 + Math.sin(o.frame) * 0.4);

  ctx.save();
  ctx.translate(0, -bob);

  drawBackGear(ctx, gear, c, u, flash, o.frame);

  // cape
  ctx.fillStyle = flash ? "#ffffff" : c.cape;
  ctx.beginPath();
  ctx.moveTo(-10 * u * wide, -46 * u);
  ctx.quadraticCurveTo((-19 - walk * 3) * u * wide, -22 * u, (-13 - walk * 2) * u * wide, -2 * u);
  ctx.quadraticCurveTo(0, -9 * u, (13 + walk * 2) * u * wide, -2 * u);
  ctx.quadraticCurveTo((19 + walk * 3) * u * wide, -22 * u, 10 * u * wide, -46 * u);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.moveTo(-2 * u, -44 * u);
  ctx.quadraticCurveTo(0, -22 * u, 2 * u, -4 * u);
  ctx.quadraticCurveTo(6 * u, -22 * u, 4 * u, -44 * u);
  ctx.closePath();
  ctx.fill();

  // legs OR robe skirt
  if (build === "robe") {
    const rg = ctx.createLinearGradient(0, robeTop, 0, 0);
    rg.addColorStop(0, flash ? "#ffffff" : shade(c.armor, 18));
    rg.addColorStop(1, flash ? "#ffffff" : shade(c.armor, -42));
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(-9 * u, robeTop);
    ctx.quadraticCurveTo(-17 * u - walk * 2 * u, -8 * u, -14 * u, 0);
    ctx.quadraticCurveTo(0, 4 * u, 14 * u, 0);
    ctx.quadraticCurveTo(17 * u + walk * 2 * u, -8 * u, 9 * u, robeTop);
    ctx.closePath();
    ctx.fill();
    // trim
    ctx.strokeStyle = withAlpha(flash ? "#ffffff" : c.accent, 0.9);
    ctx.lineWidth = 1.8 * u;
    ctx.beginPath();
    ctx.moveTo(-13.5 * u, -1 * u);
    ctx.quadraticCurveTo(0, 3 * u, 13.5 * u, -1 * u);
    ctx.stroke();
    // folds
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 1.2 * u;
    [-5, 0, 5].forEach((fx) => {
      ctx.beginPath();
      ctx.moveTo(fx * u, robeTop + 2 * u);
      ctx.quadraticCurveTo((fx + walk * 1.5) * u, -10 * u, fx * 1.5 * u, -1 * u);
      ctx.stroke();
    });
  } else {
    // stubby chibi legs
    const legW = build === "heavy" ? 8.2 : build === "slim" ? 5.6 : 6.8;
    const legA = walk * 4.2 * u;
    ctx.strokeStyle = flash ? "#ffffff" : c.dark;
    ctx.lineWidth = legW * u;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-4.8 * u * wide, -15 * u);
    ctx.lineTo(-4.8 * u * wide + legA, -2 * u);
    ctx.moveTo(4.8 * u * wide, -15 * u);
    ctx.lineTo(4.8 * u * wide - legA, -2 * u);
    ctx.stroke();
    ctx.fillStyle = flash ? "#ffffff" : shade(c.accent, -35);
    rr(ctx, (-9.4 + legA / u) * u, -4 * u, 9 * u, 4 * u, 1.9 * u);
    ctx.fill();
    rr(ctx, (0.4 - legA / u) * u, -4 * u, 9 * u, 4 * u, 1.9 * u);
    ctx.fill();
  }

  // 3/4 top-down shoulder plate (sells the Soul Knight camera angle)
  ctx.fillStyle = flash ? "#ffffff" : shade(c.armor, -18);
  ctx.beginPath();
  ctx.ellipse(0, -42 * u, 13 * u * wide, 6.4 * u, 0, 0, Math.PI * 2);
  ctx.fill();

  // torso
  const tg = ctx.createLinearGradient(-11 * u * wide, -48 * u, 11 * u * wide, -18 * u);
  tg.addColorStop(0, flash ? "#ffffff" : shade(c.armor, 42));
  tg.addColorStop(0.55, flash ? "#ffffff" : c.armor);
  tg.addColorStop(1, flash ? "#ffffff" : shade(c.armor, -44));
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.moveTo(-10.5 * u * wide, -45 * u);
  ctx.quadraticCurveTo(0, -49 * u, 10.5 * u * wide, -45 * u);
  ctx.quadraticCurveTo(12.5 * u * wide, -31 * u, 8.5 * u * wide, build === "robe" ? robeTop : -18 * u);
  ctx.quadraticCurveTo(0, build === "robe" ? robeTop + 3 * u : -15 * u, -8.5 * u * wide, build === "robe" ? robeTop : -18 * u);
  ctx.quadraticCurveTo(-12.5 * u * wide, -31 * u, -10.5 * u * wide, -45 * u);
  ctx.closePath();
  ctx.fill();

  // belt / sash
  ctx.fillStyle = flash ? "#ffffff" : c.accent;
  if (build === "robe") {
    rr(ctx, -9.5 * u, robeTop - 1 * u, 19 * u, 3.4 * u, 1.5 * u);
    ctx.fill();
    ctx.fillStyle = withAlpha("#ffffff", 0.35);
    rr(ctx, -9.5 * u, robeTop - 1 * u, 19 * u, 1.2 * u, 0.6 * u);
    ctx.fill();
  } else {
    rr(ctx, -9 * u * wide, -21.5 * u, 18 * u * wide, 3.4 * u, 1.5 * u);
    ctx.fill();
  }

  // chest emblem
  ctx.fillStyle = withAlpha(flash ? "#ffffff" : c.accent, 0.92);
  ctx.beginPath();
  ctx.moveTo(0, -41 * u);
  ctx.lineTo(3.6 * u, -34.5 * u);
  ctx.lineTo(0, -27 * u);
  ctx.lineTo(-3.6 * u, -34.5 * u);
  ctx.closePath();
  ctx.fill();

  // pauldrons
  const ps = build === "heavy" ? 1.5 : build === "slim" ? 0.78 : 1;
  if (!gear.includes("furPauldrons")) {
    ctx.fillStyle = flash ? "#ffffff" : shade(c.armor, 26);
    ctx.beginPath();
    ctx.ellipse(-11.5 * u * wide, -44 * u, 6.4 * u * ps, 5.2 * u * ps, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(11.5 * u * wide, -44 * u, 6.4 * u * ps, 5.2 * u * ps, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = withAlpha(c.accent, 0.7);
    ctx.lineWidth = 1 * u;
    ctx.beginPath();
    ctx.ellipse(-11.5 * u * wide, -44 * u, 6.4 * u * ps, 5.2 * u * ps, -0.25, 0, Math.PI * 2);
    ctx.ellipse(11.5 * u * wide, -44 * u, 6.4 * u * ps, 5.2 * u * ps, 0.25, 0, Math.PI * 2);
    ctx.stroke();
  }

  // arms (robe = wide sleeves)
  if (build === "robe") {
    ctx.fillStyle = flash ? "#ffffff" : shade(c.armor, -8);
    [-1, 1].forEach((dir) => {
      ctx.beginPath();
      ctx.moveTo(dir * 9 * u, -44 * u);
      ctx.quadraticCurveTo(dir * 18 * u, -36 * u, dir * 15 * u, -26 * u);
      ctx.quadraticCurveTo(dir * 10 * u, -28 * u, dir * 8 * u, -36 * u);
      ctx.closePath();
      ctx.fill();
    });
    ctx.fillStyle = flash ? "#ffffff" : c.skin;
    ctx.beginPath();
    ctx.arc(-14.5 * u, -26 * u, 2.6 * u, 0, Math.PI * 2);
    ctx.arc(14 * u, -28 * u, 2.6 * u, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = flash ? "#ffffff" : shade(c.armor, -12);
    ctx.lineWidth = (build === "heavy" ? 6.2 : build === "slim" ? 4.4 : 5.2) * u;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-9.5 * u * wide, -42 * u);
    ctx.quadraticCurveTo(-15 * u * wide, -33 * u, -12 * u * wide, -25 * u);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(9.5 * u * wide, -42 * u);
    ctx.quadraticCurveTo(16 * u * wide, -36 * u, 13.5 * u * wide, -32 * u);
    ctx.stroke();
    ctx.fillStyle = flash ? "#ffffff" : c.skin;
    ctx.beginPath();
    ctx.arc(-12 * u * wide, -24 * u, 2.7 * u, 0, Math.PI * 2);
    ctx.arc(13.5 * u * wide, -31 * u, 2.7 * u, 0, Math.PI * 2);
    ctx.fill();
  }

  // shield on off-arm
  if (gear.includes("shield")) {
    ctx.save();
    ctx.translate(-15 * u * wide, -32 * u);
    const sg = ctx.createLinearGradient(-9 * u, -11 * u, 9 * u, 11 * u);
    sg.addColorStop(0, shade(c.accent, 34));
    sg.addColorStop(1, shade(c.armor, -34));
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.moveTo(0, -12 * u);
    ctx.quadraticCurveTo(10 * u, -10 * u, 9 * u, 2 * u);
    ctx.quadraticCurveTo(5 * u, 13 * u, 0, 15 * u);
    ctx.quadraticCurveTo(-5 * u, 13 * u, -9 * u, 2 * u);
    ctx.quadraticCurveTo(-10 * u, -10 * u, 0, -12 * u);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = withAlpha("#ffffff", 0.45);
    ctx.lineWidth = 1.2 * u;
    ctx.stroke();
    ctx.fillStyle = withAlpha("#ffffff", 0.5);
    ctx.beginPath();
    ctx.arc(0, 0, 3 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ===== chibi head group (Soul Knight proportions: oversized head, tiny body) =====
  ctx.save();
  ctx.translate(0, 9 * u);
  ctx.scale(1.3, 1.24);

  if (o.portrait) {
    // ---- real character artwork as the head (matches the portrait exactly) ----
    ctx.fillStyle = flash ? "#ffffff" : c.skin;
    ctx.beginPath();
    ctx.ellipse(0, -49 * u, 7.6 * u, 8.4 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    drawPortraitFace(
      ctx,
      o.portrait,
      0,
      -53 * u,
      11.6 * u,
      o.portraitCrop || { u: 0.5, v: 0.395, r: 0.235 },
      c.accent,
      flash,
      0.65 + Math.sin(o.frame * 1.4) * 0.25
    );
    drawHeadgear(ctx, kit.headgear, c, u, flash, build);
    ctx.restore();
    // weapons / gear still drawn below (attack FX, dual wield, casting)
    drawWeapon(ctx, kit.weapon, c, u, swing, flash, attacking && kit.weapon === "bow");
    if (gear.includes("dualWield")) {
      ctx.save();
      ctx.scale(-1, 1);
      drawWeapon(ctx, kit.weapon, c, u, -swing * 0.8, flash, false);
      ctx.restore();
    }
    drawFrontGear(ctx, gear, c, u, flash, o.frame, build);
    if (o.casting) {
      ctx.save();
      for (let i = 0; i < 6; i++) {
        const a = o.frame * 3.2 + (i * Math.PI * 2) / 6;
        ctx.fillStyle = i % 2 ? "#ffffff" : c.accent;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(16 * u + Math.cos(a) * 7 * u, -50 * u + Math.sin(a) * 7 * u, 1.8 * u, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
    if (attacking) {
      const melee = ["sword", "greatsword", "axe", "dagger", "hammer", "claw"];
      if (melee.includes(kit.weapon)) slashFx(ctx, u, c.accent, o.attackT);
      if (gear.includes("dualWield")) slashFx(ctx, u * 0.85, "#ffffff", Math.min(1, o.attackT + 0.15), true);
    }
    return;
  }

  // head
  ctx.fillStyle = flash ? "#ffffff" : c.skin;
  ctx.beginPath();
  ctx.ellipse(0, -53 * u, 9.2 * u, 10.4 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.beginPath();
  ctx.ellipse(-3 * u, -50 * u, 8 * u, 8 * u, 0, 0.4, 2.4);
  ctx.fill();

  // hair
  ctx.fillStyle = flash ? "#ffffff" : c.hair;
  ctx.beginPath();
  ctx.moveTo(-9.8 * u, -53 * u);
  ctx.quadraticCurveTo(-10.5 * u, -68 * u, 0, -68 * u);
  ctx.quadraticCurveTo(10.5 * u, -68 * u, 9.8 * u, -53 * u);
  ctx.quadraticCurveTo(6 * u, -59 * u, 1 * u, -57 * u);
  ctx.quadraticCurveTo(-4 * u, -55 * u, -9.8 * u, -53 * u);
  ctx.closePath();
  ctx.fill();
  if (build === "slim") {
    ctx.beginPath();
    ctx.moveTo(-8 * u, -56 * u);
    ctx.quadraticCurveTo(-18 * u - walk * 3 * u, -46 * u, -12 * u, -32 * u);
    ctx.quadraticCurveTo(-8 * u, -44 * u, -5 * u, -52 * u);
    ctx.closePath();
    ctx.fill();
  }

  // eyes (large chibi eyes)
  if (kit.headgear === "hood") {
    ctx.fillStyle = withAlpha("#f43f5e", 0.95);
    ctx.shadowColor = "#f43f5e";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(3.6 * u, -53 * u, 1.9 * u, 1.4 * u, 0, 0, Math.PI * 2);
    ctx.ellipse(7.8 * u, -53 * u, 1.9 * u, 1.4 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  } else {
    ctx.fillStyle = "#0b1020";
    ctx.beginPath();
    ctx.ellipse(3.2 * u, -53 * u, 1.9 * u, 2.6 * u, 0, 0, Math.PI * 2);
    ctx.ellipse(7.9 * u, -53 * u, 1.9 * u, 2.6 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(2.6 * u, -54.2 * u, 0.85 * u, 0, Math.PI * 2);
    ctx.arc(7.3 * u, -54.2 * u, 0.85 * u, 0, Math.PI * 2);
    ctx.fill();
  }

  drawHeadgear(ctx, kit.headgear, c, u, flash, build);
  ctx.restore();

  // weapons (dual wield mirrors a second weapon in the off-hand)
  drawWeapon(ctx, kit.weapon, c, u, swing, flash, attacking && kit.weapon === "bow");
  if (gear.includes("dualWield")) {
    ctx.save();
    ctx.scale(-1, 1);
    drawWeapon(ctx, kit.weapon === "dagger" ? "dagger" : kit.weapon, c, u, -swing * 0.8, flash, false);
    ctx.restore();
  }

  drawFrontGear(ctx, gear, c, u, flash, o.frame, build);

  if (o.casting) {
    ctx.save();
    for (let i = 0; i < 6; i++) {
      const a = o.frame * 3.2 + (i * Math.PI * 2) / 6;
      ctx.fillStyle = i % 2 ? "#ffffff" : c.accent;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(16 * u + Math.cos(a) * 7 * u, -50 * u + Math.sin(a) * 7 * u, 1.8 * u, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.restore();

  if (attacking) {
    const melee = ["sword", "greatsword", "axe", "dagger", "hammer", "claw"];
    if (melee.includes(kit.weapon)) slashFx(ctx, u, c.accent, o.attackT);
    if (gear.includes("dualWield")) slashFx(ctx, u * 0.85, "#ffffff", Math.min(1, o.attackT + 0.15), true);
  }
}

/* ------------------------------------------------------------------ */
/* Non-humanoid shapes                                                 */
/* ------------------------------------------------------------------ */

function beast(ctx: CanvasRenderingContext2D, kit: SpriteKit, o: DrawOpts) {
  const u = kit.scale / 4;
  const c = kit.colors;
  const flash = o.hitFlash > 0;
  const step = Math.sin(o.frame * 2.2);
  const run = o.moving ? step : Math.sin(o.frame * 0.7) * 0.3;

  groundShadow(ctx, 26 * u);
  aura(ctx, o.elite ? "#fb923c" : c.accent, 36 * u, 0.5 + Math.sin(o.frame) * 0.4);

  ctx.save();
  ctx.strokeStyle = flash ? "#ffffff" : shade(c.dark, 10);
  ctx.lineWidth = 4.6 * u;
  ctx.lineCap = "round";
  [-15, -7, 7, 15].forEach((x, i) => {
    const off = (i % 2 === 0 ? run : -run) * 4.5 * u;
    ctx.beginPath();
    ctx.moveTo(x * u, -14 * u);
    ctx.lineTo(x * u + off, -1 * u);
    ctx.stroke();
  });

  ctx.strokeStyle = flash ? "#ffffff" : c.armor;
  ctx.lineWidth = 4.4 * u;
  ctx.beginPath();
  ctx.moveTo(18 * u, -20 * u);
  ctx.quadraticCurveTo(32 * u, -24 * u - run * 6 * u, 28 * u, -36 * u);
  ctx.stroke();

  const bg = ctx.createLinearGradient(0, -33 * u, 0, -10 * u);
  bg.addColorStop(0, flash ? "#ffffff" : shade(c.armor, 38));
  bg.addColorStop(1, flash ? "#ffffff" : shade(c.armor, -36));
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.ellipse(0, -20 * u, 22 * u, 11.5 * u, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = withAlpha(flash ? "#ffffff" : c.accent, 0.75);
  ctx.beginPath();
  ctx.moveTo(-14 * u, -28 * u);
  for (let i = 0; i < 6; i++) {
    ctx.lineTo((-10 + i * 5) * u, -34 * u);
    ctx.lineTo((-7 + i * 5) * u, -27 * u);
  }
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = flash ? "#ffffff" : shade(c.armor, 18);
  ctx.beginPath();
  ctx.ellipse(-23 * u, -26 * u, 10.5 * u, 9 * u, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = flash ? "#ffffff" : shade(c.dark, 22);
  ctx.beginPath();
  ctx.ellipse(-32 * u, -23 * u, 6.4 * u, 4.2 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = flash ? "#ffffff" : c.dark;
  ctx.beginPath();
  ctx.moveTo(-27 * u, -33 * u);
  ctx.lineTo(-24 * u, -43 * u);
  ctx.lineTo(-20 * u, -33 * u);
  ctx.closePath();
  ctx.moveTo(-18 * u, -33 * u);
  ctx.lineTo(-14 * u, -42 * u);
  ctx.lineTo(-11 * u, -31 * u);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ff4d4d";
  ctx.shadowColor = "#ff4d4d";
  ctx.shadowBlur = 9;
  ctx.beginPath();
  ctx.ellipse(-25 * u, -28 * u, 1.9 * u, 1.5 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#f8fafc";
  ctx.beginPath();
  ctx.moveTo(-34 * u, -21 * u);
  ctx.lineTo(-32.4 * u, -16.5 * u);
  ctx.lineTo(-30.6 * u, -21 * u);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  if (o.attackT > 0 && o.attackT < 1) slashFx(ctx, u, c.accent, o.attackT);
}

function spider(ctx: CanvasRenderingContext2D, kit: SpriteKit, o: DrawOpts) {
  const u = kit.scale / 4;
  const c = kit.colors;
  const flash = o.hitFlash > 0;
  const wig = Math.sin(o.frame * 2.4);

  groundShadow(ctx, 21 * u);
  aura(ctx, o.elite ? "#fb923c" : c.accent, 32 * u, 0.5);

  ctx.save();
  ctx.strokeStyle = flash ? "#ffffff" : c.dark;
  ctx.lineWidth = 2.8 * u;
  ctx.lineCap = "round";
  for (let i = 0; i < 4; i++) {
    const off = (i % 2 === 0 ? wig : -wig) * 3.4 * u;
    ctx.beginPath();
    ctx.moveTo(-6 * u, -18 * u);
    ctx.quadraticCurveTo(-19 * u - i * 2 * u, -23 * u + off, -23 * u - i * 2 * u, -2 * u);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(6 * u, -18 * u);
    ctx.quadraticCurveTo(19 * u + i * 2 * u, -23 * u - off, 23 * u + i * 2 * u, -2 * u);
    ctx.stroke();
  }

  const ab = ctx.createRadialGradient(-3 * u, -25 * u, 2 * u, 0, -18 * u, 17 * u);
  ab.addColorStop(0, flash ? "#ffffff" : shade(c.armor, 48));
  ab.addColorStop(1, flash ? "#ffffff" : shade(c.armor, -42));
  ctx.fillStyle = ab;
  ctx.beginPath();
  ctx.ellipse(0, -18 * u, 16 * u, 12.5 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = withAlpha(c.accent, 0.5);
  ctx.beginPath();
  ctx.ellipse(-2 * u, -25 * u, 6.5 * u, 3.6 * u, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = flash ? "#ffffff" : shade(c.dark, 28);
  ctx.beginPath();
  ctx.ellipse(-15 * u, -16 * u, 7.5 * u, 6.4 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ff4d4d";
  ctx.shadowColor = "#ff4d4d";
  ctx.shadowBlur = 9;
  [[-18, -19], [-13.5, -20], [-18, -13.5], [-12.5, -13.5]].forEach(([ex, ey]) => {
    ctx.beginPath();
    ctx.arc(ex * u, ey * u, 1.6 * u, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 1.7 * u;
  ctx.beginPath();
  ctx.moveTo(-20 * u, -12 * u);
  ctx.lineTo(-21 * u, -6 * u);
  ctx.moveTo(-15.5 * u, -11 * u);
  ctx.lineTo(-15.5 * u, -5 * u);
  ctx.stroke();
  ctx.restore();
}

function wisp(ctx: CanvasRenderingContext2D, kit: SpriteKit, o: DrawOpts) {
  const u = kit.scale / 4;
  const c = kit.colors;
  const flash = o.hitFlash > 0;
  const float = Math.sin(o.frame * 1.3) * 4.5 * u;

  ctx.save();
  ctx.translate(0, -28 * u + float);
  const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 24 * u);
  g.addColorStop(0, flash ? "#ffffff" : withAlpha(c.accent, 0.95));
  g.addColorStop(0.45, withAlpha(flash ? "#ffffff" : c.armor, 0.5));
  g.addColorStop(1, withAlpha(c.armor, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 24 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = flash ? "#ffffff" : c.accent;
  ctx.beginPath();
  ctx.ellipse(0, 0, 9.5 * u, 11.5 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0b1020";
  ctx.beginPath();
  ctx.ellipse(-3.4 * u, -1.6 * u, 1.6 * u, 2.8 * u, 0, 0, Math.PI * 2);
  ctx.ellipse(3.4 * u, -1.6 * u, 1.6 * u, 2.8 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  // leafy wisps
  ctx.fillStyle = withAlpha("#ffffff", 0.6);
  for (let i = 0; i < 4; i++) {
    const a = o.frame * 2 + i * 1.7;
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * 13 * u, 13 * u + i * 4 * u, 2.2 * u, 1.2 * u, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function dragon(ctx: CanvasRenderingContext2D, kit: SpriteKit, o: DrawOpts) {
  const u = kit.scale / 4;
  const c = kit.colors;
  const flash = o.hitFlash > 0;
  const flap = Math.sin(o.frame * 1.5);

  groundShadow(ctx, 46 * u);
  aura(ctx, "#38bdf8", 76 * u, 0.5 + flap * 0.3);

  ctx.save();
  const wg = ctx.createLinearGradient(0, -76 * u, 0, -20 * u);
  wg.addColorStop(0, flash ? "#ffffff" : shade(c.cape, 34));
  wg.addColorStop(1, flash ? "#ffffff" : shade(c.cape, -28));
  ctx.fillStyle = wg;
  [-1, 1].forEach((dir) => {
    ctx.beginPath();
    ctx.moveTo(dir * 8 * u, -46 * u);
    ctx.quadraticCurveTo(dir * 48 * u, -84 * u - flap * 9 * u, dir * 60 * u, -42 * u);
    ctx.quadraticCurveTo(dir * 42 * u, -48 * u, dir * 36 * u, -28 * u);
    ctx.quadraticCurveTo(dir * 22 * u, -38 * u, dir * 8 * u, -30 * u);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = withAlpha("#ffffff", 0.2);
    ctx.lineWidth = 1.2 * u;
    ctx.stroke();
  });

  ctx.strokeStyle = flash ? "#ffffff" : shade(c.armor, -20);
  ctx.lineWidth = 9.5 * u;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(14 * u, -26 * u);
  ctx.quadraticCurveTo(50 * u, -22 * u - flap * 7 * u, 60 * u, -46 * u);
  ctx.stroke();
  ctx.fillStyle = flash ? "#ffffff" : c.accent;
  ctx.beginPath();
  ctx.moveTo(60 * u, -46 * u);
  ctx.lineTo(71 * u, -55 * u);
  ctx.lineTo(62 * u, -35 * u);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = flash ? "#ffffff" : shade(c.dark, 22);
  ctx.lineWidth = 8.5 * u;
  ctx.beginPath();
  ctx.moveTo(-6 * u, -22 * u);
  ctx.lineTo(-9 * u, -2 * u);
  ctx.moveTo(10 * u, -22 * u);
  ctx.lineTo(13 * u, -2 * u);
  ctx.stroke();

  const bg = ctx.createLinearGradient(0, -58 * u, 0, -12 * u);
  bg.addColorStop(0, flash ? "#ffffff" : shade(c.armor, 46));
  bg.addColorStop(1, flash ? "#ffffff" : shade(c.armor, -40));
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.ellipse(2 * u, -31 * u, 23 * u, 19 * u, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = withAlpha(flash ? "#ffffff" : c.accent, 0.7);
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(2 * u, (-40 + i * 6.5) * u, (14 - i) * u, 2.3 * u, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = flash ? "#ffffff" : shade(c.armor, 12);
  ctx.lineWidth = 11.5 * u;
  ctx.beginPath();
  ctx.moveTo(-12 * u, -42 * u);
  ctx.quadraticCurveTo(-30 * u, -52 * u, -36 * u, -64 * u);
  ctx.stroke();
  ctx.fillStyle = flash ? "#ffffff" : shade(c.armor, 28);
  ctx.beginPath();
  ctx.ellipse(-42 * u, -66 * u, 13.5 * u, 9.5 * u, -0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = flash ? "#ffffff" : shade(c.dark, 28);
  ctx.beginPath();
  ctx.ellipse(-52 * u, -62 * u, 8.5 * u, 5.2 * u, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = flash ? "#ffffff" : c.accent;
  ctx.beginPath();
  ctx.moveTo(-38 * u, -72 * u);
  ctx.quadraticCurveTo(-31 * u, -88 * u, -22 * u, -83 * u);
  ctx.quadraticCurveTo(-31 * u, -76 * u, -34 * u, -70 * u);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#67e8f9";
  ctx.shadowColor = "#67e8f9";
  ctx.shadowBlur = 13;
  ctx.beginPath();
  ctx.ellipse(-42 * u, -69 * u, 2.8 * u, 2.1 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#f8fafc";
  ctx.beginPath();
  ctx.moveTo(-56 * u, -59 * u);
  ctx.lineTo(-54 * u, -53 * u);
  ctx.lineTo(-52 * u, -59 * u);
  ctx.closePath();
  ctx.fill();

  if (o.attackT > 0 && o.attackT < 1) {
    ctx.save();
    ctx.globalAlpha = 0.85;
    for (let i = 0; i < 9; i++) {
      const d = i * 10 * u * (0.4 + o.attackT);
      const g = ctx.createRadialGradient(-58 * u - d, -60 * u, 0, -58 * u - d, -60 * u, 6 * u);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.5, i % 2 ? "#7dd3fc" : "#bae6fd");
      g.addColorStop(1, "rgba(125,211,252,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(-58 * u - d, -60 * u + Math.sin(i + o.frame * 6) * 5 * u, (4 - i * 0.28) * u, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}

function treant(ctx: CanvasRenderingContext2D, kit: SpriteKit, o: DrawOpts) {
  const u = kit.scale / 4;
  const c = kit.colors;
  const flash = o.hitFlash > 0;
  const sway = Math.sin(o.frame * 0.9);

  groundShadow(ctx, 40 * u);
  aura(ctx, "#4ade80", 64 * u, 0.5 + sway * 0.3);

  ctx.save();
  ctx.strokeStyle = flash ? "#ffffff" : shade(c.dark, 18);
  ctx.lineWidth = 9.5 * u;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-10 * u, -18 * u);
  ctx.lineTo(-17 * u, -1 * u);
  ctx.moveTo(10 * u, -18 * u);
  ctx.lineTo(17 * u, -1 * u);
  ctx.stroke();

  const tg = ctx.createLinearGradient(-16 * u, 0, 16 * u, -60 * u);
  tg.addColorStop(0, flash ? "#ffffff" : shade(c.dark, 28));
  tg.addColorStop(0.5, flash ? "#ffffff" : c.armor);
  tg.addColorStop(1, flash ? "#ffffff" : shade(c.dark, 12));
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.moveTo(-17 * u, -14 * u);
  ctx.quadraticCurveTo(-13 * u, -46 * u, -10 * u, -60 * u);
  ctx.lineTo(10 * u, -60 * u);
  ctx.quadraticCurveTo(13 * u, -46 * u, 17 * u, -14 * u);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 1.5 * u;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 6.5 * u, -16 * u);
    ctx.quadraticCurveTo(i * 6.5 * u + sway * 2 * u, -40 * u, i * 5.5 * u, -58 * u);
    ctx.stroke();
  }

  ctx.strokeStyle = flash ? "#ffffff" : c.armor;
  ctx.lineWidth = 7.5 * u;
  ctx.beginPath();
  ctx.moveTo(-11 * u, -52 * u);
  ctx.quadraticCurveTo(-34 * u, -56 * u + sway * 6 * u, -42 * u, -38 * u);
  ctx.moveTo(11 * u, -52 * u);
  ctx.quadraticCurveTo(34 * u, -56 * u - sway * 6 * u, 42 * u, -38 * u);
  ctx.stroke();
  ctx.fillStyle = flash ? "#ffffff" : c.accent;
  [-42, 42].forEach((dx) => {
    ctx.beginPath();
    ctx.arc(dx * u, -36 * u, 7.5 * u, 0, Math.PI * 2);
    ctx.fill();
  });

  const cg = ctx.createRadialGradient(-4 * u, -76 * u, 4 * u, 0, -70 * u, 32 * u);
  cg.addColorStop(0, flash ? "#ffffff" : shade(c.accent, 34));
  cg.addColorStop(1, flash ? "#ffffff" : shade(c.armor, -28));
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.ellipse(0, -72 * u, 30 * u, 19 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-17 * u, -62 * u, 15 * u, 10.5 * u, 0, 0, Math.PI * 2);
  ctx.ellipse(17 * u, -62 * u, 15 * u, 10.5 * u, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#0b1020";
  ctx.beginPath();
  ctx.ellipse(-6.5 * u, -45 * u, 4.6 * u, 3.4 * u, 0, 0, Math.PI * 2);
  ctx.ellipse(6.5 * u, -45 * u, 4.6 * u, 3.4 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#facc15";
  ctx.shadowColor = "#facc15";
  ctx.shadowBlur = 13;
  ctx.beginPath();
  ctx.arc(-6.5 * u, -45 * u, 2.1 * u, 0, Math.PI * 2);
  ctx.arc(6.5 * u, -45 * u, 2.1 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#0b1020";
  ctx.lineWidth = 2.6 * u;
  ctx.beginPath();
  ctx.moveTo(-7.5 * u, -32 * u);
  ctx.quadraticCurveTo(0, -25 * u, 7.5 * u, -32 * u);
  ctx.stroke();
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Master renderer                                                     */
/* ------------------------------------------------------------------ */

export function drawUnit(ctx: CanvasRenderingContext2D, kit: SpriteKit, o: DrawOpts) {
  ctx.save();
  ctx.translate(Math.round(o.x), Math.round(o.y));
  if (o.dead) {
    ctx.globalAlpha = 0.45;
  }
  if (o.facingLeft) ctx.scale(-1, 1);

  if (o.elite || o.boss) {
    const col = o.boss ? "#f43f5e" : "#fb923c";
    const rad = (o.boss ? 50 : 32) * (kit.scale / 4);
    ctx.save();
    ctx.strokeStyle = withAlpha(col, 0.5 + Math.sin(o.frame * 3) * 0.28);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, rad, rad * 0.34, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // ===== genuine pixel-art chibi (Soul Knight style) =====
  if (kit.pixel && (kit.shape === "humanoid" || kit.shape === "knight")) {
    const u = Math.max(3, Math.round(kit.scale));
    const dp = o.dead ? 1 : o.deathProgress ?? 0;
    ctx.save();
    // DIE animation: sink + squash + fade
    if (dp > 0) {
      ctx.globalAlpha = Math.max(0.1, 1 - dp * 0.9);
      ctx.translate(0, 4 * u * 0.4 * dp);
      ctx.scale(1, 1 - 0.55 * dp);
    }
    // shadow shrinks as the character collapses
    ctx.fillStyle = `rgba(0,0,0,${0.45 * (1 - dp * 0.5)})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, 17 * u * 0.72 * (1 - dp * 0.4), 17 * u * 0.24 * (1 - dp * 0.4), 0, 0, Math.PI * 2);
    ctx.fill();
    if (dp < 0.5) {
      aura(ctx, o.boss ? "#f43f5e" : o.elite ? "#fb923c" : kit.colors.accent, 48 * (u / 5), 0.5 + Math.sin(o.frame * 1.3) * 0.3);
    }
    drawChibi(ctx, kit.pixel, {
      u,
      frame: o.frame,
      moving: o.moving,
      attackT: o.attackT,
      hitFlash: o.hitFlash,
      dashing: o.dashing,
      dead: o.dead,
      boss: o.boss,
      elite: o.elite,
    });
    ctx.restore();
    ctx.restore();
    return;
  }

  switch (kit.shape) {
    case "beast":
      beast(ctx, kit, o);
      break;
    case "spider":
      spider(ctx, kit, o);
      break;
    case "wisp":
      wisp(ctx, kit, o);
      break;
    case "dragon":
      dragon(ctx, kit, o);
      break;
    case "treant":
      treant(ctx, kit, o);
      break;
    case "knight":
    case "humanoid":
    default:
      humanoid(ctx, kit, o);
      break;
  }

  // Non-humanoid creatures wear their real artwork as a face medallion too,
  // anchored on the head of each creature shape.
  if (o.portrait && kit.shape !== "humanoid" && kit.shape !== "knight") {
    const u = kit.scale / 4;
    const anchors: Record<string, [number, number, number]> = {
      dragon: [-42, -66, 11.5],
      treant: [0, -45, 12.5],
      beast: [-23, -26, 9],
      spider: [-15, -16, 7],
      wisp: [0, -28, 10],
    };
    const a = anchors[kit.shape] || [0, -40, 10];
    drawPortraitFace(
      ctx,
      o.portrait,
      a[0] * u,
      a[1] * u,
      a[2] * u,
      o.portraitCrop || { u: 0.5, v: 0.46, r: 0.3 },
      kit.colors.accent,
      o.hitFlash > 0,
      o.boss ? 0.9 : 0.5
    );
  }

  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Terrain props                                                       */
/* ------------------------------------------------------------------ */

export function drawTerrainProp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  kind: string,
  theme: string[]
) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  ctx.fillStyle = "rgba(0,0,0,0.38)";
  ctx.beginPath();
  ctx.ellipse(w / 2, h, w * 0.55, h * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  if (kind === "tree") {
    const trunk = ctx.createLinearGradient(0, 0, w, 0);
    trunk.addColorStop(0, "#4a3520");
    trunk.addColorStop(1, "#2a1d10");
    ctx.fillStyle = trunk;
    rr(ctx, w * 0.38, h * 0.42, w * 0.24, h * 0.6, 4);
    ctx.fill();
    const canopy = ctx.createRadialGradient(w * 0.4, h * 0.28, 4, w * 0.5, h * 0.34, w * 0.75);
    canopy.addColorStop(0, theme[1]);
    canopy.addColorStop(1, theme[0]);
    ctx.fillStyle = canopy;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.3, w * 0.54, h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = withAlpha(theme[2], 0.5);
    ctx.beginPath();
    ctx.ellipse(w * 0.34, h * 0.2, w * 0.23, h * 0.14, -0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "crystal") {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, withAlpha(theme[2], 0.95));
    g.addColorStop(0.5, theme[1]);
    g.addColorStop(1, theme[0]);
    ctx.fillStyle = g;
    ctx.shadowColor = theme[1];
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(w * 0.5, 0);
    ctx.lineTo(w * 0.86, h * 0.42);
    ctx.lineTo(w * 0.68, h);
    ctx.lineTo(w * 0.3, h);
    ctx.lineTo(w * 0.14, h * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.moveTo(w * 0.5, 2);
    ctx.lineTo(w * 0.6, h * 0.5);
    ctx.lineTo(w * 0.44, h * 0.85);
    ctx.closePath();
    ctx.fill();
  } else if (kind === "pillar") {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, theme[0]);
    g.addColorStop(0.45, theme[1]);
    g.addColorStop(1, "#0d0a14");
    ctx.fillStyle = g;
    rr(ctx, 0, h * 0.08, w, h * 0.92, 6);
    ctx.fill();
    ctx.fillStyle = theme[2];
    rr(ctx, -w * 0.08, 0, w * 1.16, h * 0.12, 5);
    ctx.fill();
    ctx.fillStyle = withAlpha(theme[2], 0.6);
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.5, Math.min(w, h) * 0.15, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "lava") {
    const g = ctx.createRadialGradient(w * 0.5, h * 0.7, 2, w * 0.5, h * 0.7, w * 0.72);
    g.addColorStop(0, theme[2]);
    g.addColorStop(0.5, theme[1]);
    g.addColorStop(1, withAlpha(theme[0], 0.15));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.75, w * 0.56, h * 0.33, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2a1410";
    ctx.beginPath();
    ctx.moveTo(w * 0.16, h * 0.8);
    ctx.quadraticCurveTo(w * 0.4, h * 0.2, w * 0.55, h * 0.62);
    ctx.quadraticCurveTo(w * 0.72, h * 0.3, w * 0.88, h * 0.8);
    ctx.closePath();
    ctx.fill();
  } else {
    const g = ctx.createLinearGradient(0, 0, w * 0.6, h);
    g.addColorStop(0, theme[1]);
    g.addColorStop(1, theme[0]);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(w * 0.12, h);
    ctx.quadraticCurveTo(0, h * 0.4, w * 0.34, h * 0.16);
    ctx.quadraticCurveTo(w * 0.62, -h * 0.04, w * 0.86, h * 0.36);
    ctx.quadraticCurveTo(w * 1.02, h * 0.72, w * 0.8, h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = withAlpha(theme[2], 0.5);
    ctx.beginPath();
    ctx.moveTo(w * 0.34, h * 0.2);
    ctx.quadraticCurveTo(w * 0.56, h * 0.34, w * 0.5, h * 0.72);
    ctx.quadraticCurveTo(w * 0.34, h * 0.5, w * 0.34, h * 0.2);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}
