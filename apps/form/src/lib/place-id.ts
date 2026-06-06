/**
 * Google's `writereview?placeid=` endpoint only accepts the canonical
 * `ChIJ…` Place ID. Some businesses were onboarded with the *hex feature ID*
 * form instead (e.g. `0x47a85146b41ada43:0x5cc76a2ad85b1595`, the value found
 * in Maps data URLs), which 404s the review handoff.
 *
 * The two forms are losslessly interconvertible: a hex feature ID is just two
 * little-endian fixed64 protobuf fields, base64url-encoded, to produce the
 * `ChIJ…` ID. We normalize on read so a bad stored value still yields a working
 * link — no data migration required.
 */

const HEX_FEATURE_ID = /^0x([0-9a-f]+):0x([0-9a-f]+)$/i;

/** Encode a `0x…:0x…` hex feature ID into a canonical `ChIJ…` Place ID. */
function hexFeatureToPlaceId(part1: string, part2: string): string {
  const le = (h: string) => Buffer.from(h.padStart(16, "0"), "hex").reverse();
  // protobuf: field 1 (fixed64) = 0x09, field 2 (fixed64) = 0x11
  const body = Buffer.concat([
    Buffer.from([0x09]),
    le(part1),
    Buffer.from([0x11]),
    le(part2),
  ]);
  // wrap in the outer length-delimited field 1 (0x0a + length)
  const wrapped = Buffer.concat([Buffer.from([0x0a, body.length]), body]);
  return wrapped
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Returns a Place ID safe to pass to `writereview?placeid=`.
 * Canonical IDs pass through unchanged; hex feature IDs are converted.
 * Returns null for null/empty input.
 */
export function normalizePlaceId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  const m = value.match(HEX_FEATURE_ID);
  if (m) return hexFeatureToPlaceId(m[1], m[2]);
  return value;
}
