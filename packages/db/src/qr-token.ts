// Scan-token generation + minting for token-based counter cards (ADR 0015).
//
// A token is the short, human-readable code printed under a card's QR and carried
// in the resolver URL (…/q/{token}). It is the input for typed assignment, so it
// must be reliably read and typed: an ambiguity-free alphabet (no 0/O, 1/I/L),
// stored and compared in UPPERCASE (lookups normalise case).
import { randomInt } from "node:crypto";
import { Prisma, type QrCode } from "@prisma/client";
import { prisma } from "./index";

// Unambiguous alphabet: digits 2–9 + A–Z minus I, L, O. 31 symbols.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const TOKEN_LENGTH = 5; // 31^5 ≈ 28.6M — ample at pilot scale, easy to read/type

/** Generates one random, uppercase, ambiguity-free token (not collision-checked). */
export function generateToken(length = TOKEN_LENGTH): string {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

/** Normalises typed/URL input to the stored form (uppercase, trimmed). */
export function normaliseToken(raw: string): string {
  return raw.trim().toUpperCase();
}

/**
 * Mints `count` unassigned tokens, retrying past the (rare) unique collision so a
 * batch always yields exactly `count` rows. Returns the created tokens.
 */
export async function mintTokens(count: number, batchLabel?: string): Promise<QrCode[]> {
  const created: QrCode[] = [];
  for (let i = 0; i < count; i++) {
    created.push(await mintOne(batchLabel));
  }
  return created;
}

async function mintOne(batchLabel?: string, attempt = 0): Promise<QrCode> {
  try {
    return await prisma.qrCode.create({
      data: { token: generateToken(), batchLabel: batchLabel || null },
    });
  } catch (err) {
    // P2002 = unique constraint (token collision) — regenerate and retry.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002" &&
      attempt < 8
    ) {
      return mintOne(batchLabel, attempt + 1);
    }
    throw err;
  }
}
