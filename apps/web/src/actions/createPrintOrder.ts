"use server";

import { prisma } from "@repo/db";
import { z } from "zod";
import { availableCardVariants, cardVariantKey } from "@/lib/card-templates";

const itemSchema = z.object({
  hasNfc: z.boolean(),
  language: z.enum(["en", "de"]), // selects which SVG template is printed (ADR 0011)
  quantity: z.number().int().min(1).max(6), // max 6 per variant line item (ADR 0012)
});

const schema = z.object({
  businessId: z.string().min(1),
  logoUrl: z.string().url().or(z.literal("")).optional(),
  items: z.array(itemSchema).min(1).max(4), // at most one line item per (hasNfc × language) variant
});

export type CreatePrintOrderInput = z.infer<typeof schema>;

export async function createPrintOrder(input: CreatePrintOrderInput) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid order details." };
  }

  const { businessId, logoUrl, items } = parsed.data;

  // Reject duplicate variants — the cart should hold one line per variant.
  const keys = items.map((i) => cardVariantKey(i.hasNfc, i.language));
  if (new Set(keys).size !== keys.length) {
    return { ok: false as const, error: "Duplicate card variants in the order." };
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true },
  });
  if (!business) {
    return { ok: false as const, error: "Business not found." };
  }

  // One active order at a time (ADR 0012) — block while one is being processed.
  const existing = await prisma.printOrder.findFirst({
    where: { businessId, status: "pending" },
    select: { id: true },
  });
  if (existing) {
    return {
      ok: false as const,
      error: "You already have an order being processed. Please wait until it ships.",
    };
  }

  // Backstop: never accept a variant whose template artwork doesn't exist yet.
  const available = new Set(await availableCardVariants());
  const unavailable = keys.find((k) => !available.has(k));
  if (unavailable) {
    return { ok: false as const, error: "One of the selected cards isn't available yet." };
  }

  await prisma.printOrder.create({
    data: {
      businessId,
      logoUrl: logoUrl?.trim() || null,
      status: "pending",
      items: {
        create: items.map((i) => ({
          hasNfc: i.hasNfc,
          language: i.language,
          quantity: i.quantity,
        })),
      },
    },
  });

  return { ok: true as const };
}
