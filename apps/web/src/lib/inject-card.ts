// Stamps the generated QR and the business logo into a Card Template SVG's two
// named slots (`#qr-code`, `#brand-logo`) — see docs/cards-feature.md + ADR 0011.
//
// Browser-only (uses DOMParser / XMLSerializer): called from the client studio
// preview. When Phase 2/3 need server-side compositing this should move to a
// shared package with a DOM-agnostic implementation.

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";

// The `#qr-code` placeholder occupies a 900×900 box centred on the slot's
// origin (a white rect scaled 4.1667× inside a translate(-450,-450) wrapper).
// We fill that same footprint with the generated QR so it lands pixel-for-pixel
// where the designer placed it.
const QR_BOX = { x: -450, y: -450, size: 900 };

// The `#brand-logo` placeholder is a <use> at (0,0) sized 714×274 inside the
// slot's own transform; we swap it for an <image> with the same geometry.
const LOGO_BOX = { x: 0, y: 0, width: 714, height: 274 };

export interface InjectCardOptions {
  /** A standalone `<svg>…</svg>` string for the QR (e.g. from `qrcode.toString`). */
  qrSvg: string;
  /** Business logo URL, or null to leave the brand-logo slot empty. */
  logoUrl: string | null;
}

/** Returns the template SVG as a string with the QR + logo injected. */
export function injectCard(rawSvg: string, { qrSvg, logoUrl }: InjectCardOptions): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawSvg, "image/svg+xml");

  // ── QR ──────────────────────────────────────────────────────────────
  const qrSlot = doc.getElementById("qr-code");
  if (!qrSlot) warnMissingSlot("qr-code");
  if (qrSlot) {
    clearChildren(qrSlot);
    const qrRoot = parser.parseFromString(qrSvg, "image/svg+xml").documentElement;
    // Position the QR's own <svg> as a nested viewport filling the box.
    qrRoot.setAttribute("x", String(QR_BOX.x));
    qrRoot.setAttribute("y", String(QR_BOX.y));
    qrRoot.setAttribute("width", String(QR_BOX.size));
    qrRoot.setAttribute("height", String(QR_BOX.size));
    qrSlot.appendChild(doc.importNode(qrRoot, true));
  }

  // ── Brand logo ──────────────────────────────────────────────────────
  const logoSlot = doc.getElementById("brand-logo");
  if (!logoSlot) warnMissingSlot("brand-logo");
  if (logoSlot) {
    clearChildren(logoSlot);
    if (logoUrl) {
      const img = doc.createElementNS(SVG_NS, "image");
      img.setAttribute("x", String(LOGO_BOX.x));
      img.setAttribute("y", String(LOGO_BOX.y));
      img.setAttribute("width", String(LOGO_BOX.width));
      img.setAttribute("height", String(LOGO_BOX.height));
      img.setAttribute("preserveAspectRatio", "xMidYMid meet"); // contain + centre
      img.setAttribute("href", logoUrl);
      img.setAttributeNS(XLINK_NS, "xlink:href", logoUrl); // older renderers
      logoSlot.appendChild(img);
    }
    // No logo → leave the slot empty; the static left-side #jugnoo-logo brands it.
  }

  return new XMLSerializer().serializeToString(doc.documentElement);
}

function clearChildren(el: Element) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

// A template missing a slot id injects nothing for that slot — easy to miss
// visually (e.g. the brand logo silently absent). Surface it in development.
function warnMissingSlot(id: string) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[injectCard] template is missing the #${id} slot — nothing injected there.`);
  }
}
