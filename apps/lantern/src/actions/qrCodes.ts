"use server";

import { prisma, mintTokens, normaliseToken } from "@repo/db";
import { revalidatePath } from "next/cache";

const PATH = "/dashboard/qr-codes";

/** Mint a batch of N unassigned tokens with an optional ops batch label (ADR 0015). */
export async function mintBatch(formData: FormData) {
  const qty = Number(formData.get("qty"));
  const batchLabel = String(formData.get("batchLabel") ?? "").trim();
  if (!Number.isInteger(qty) || qty < 1 || qty > 500) {
    throw new Error("Quantity must be between 1 and 500.");
  }
  await mintTokens(qty, batchLabel || undefined);
  revalidatePath(PATH);
}

export type AssignState = { ok: boolean; assigned?: number; unmatched?: string[]; error?: string };

/**
 * Stage-1 typed assignment: link 1–N codes to one business in a single action
 * (ADR 0015). Targets unassigned OR assigned tokens (assigning an already-assigned
 * token is a direct reassign); retired tokens must be Restored first, so they are
 * reported as unmatched rather than silently revived.
 */
export async function assignTokens(_prev: AssignState, formData: FormData): Promise<AssignState> {
  const businessId = String(formData.get("businessId") ?? "").trim();
  const raw = String(formData.get("codes") ?? "");
  if (!businessId) return { ok: false, error: "Pick a business." };

  const codes = [...new Set(raw.split(/[\s,]+/).map(normaliseToken).filter(Boolean))];
  if (codes.length === 0) return { ok: false, error: "Enter at least one code." };

  const business = await prisma.business.findUnique({ where: { id: businessId }, select: { id: true } });
  if (!business) return { ok: false, error: "Business not found." };

  const result = await prisma.qrCode.updateMany({
    where: { token: { in: codes }, status: { in: ["unassigned", "assigned"] } },
    data: { status: "assigned", businessId, assignedAt: new Date() },
  });

  // Anything not updated (unknown or retired) is surfaced so a typo isn't silent.
  const matched = await prisma.qrCode.findMany({
    where: { token: { in: codes }, businessId, status: "assigned" },
    select: { token: true },
  });
  const matchedSet = new Set(matched.map((m) => m.token));
  const unmatched = codes.filter((c) => !matchedSet.has(c));

  revalidatePath(PATH);
  return { ok: true, assigned: result.count, unmatched };
}

/** Unassign back to stock (assigned → unassigned). */
export async function unassignToken(formData: FormData) {
  await setStatus(formData, { status: "unassigned", businessId: null, assignedAt: null });
}

/** Retire (any → retired); drops the business link so Restore returns it to clean stock. */
export async function retireToken(formData: FormData) {
  await setStatus(formData, { status: "retired", businessId: null, assignedAt: null });
}

/** Restore a retired token to unassigned stock. */
export async function restoreToken(formData: FormData) {
  await setStatus(formData, { status: "unassigned", businessId: null, assignedAt: null });
}

async function setStatus(
  formData: FormData,
  data: { status: string; businessId: null; assignedAt: null },
) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Token id is required.");
  await prisma.qrCode.update({ where: { id }, data });
  revalidatePath(PATH);
}
