"use server";

import { prisma } from "@repo/db";
import { z } from "zod";

const schema = z.object({
  businessId: z.string().min(1),
  quantity: z.number().int().min(1).max(5), // max 5 physical cards per order (paper + NFC share the pool)
  hasNfc: z.boolean(),
  language: z.enum(["en", "de"]), // selects which of the 4 SVG templates to print (ADR 0011)
  logoUrl: z.string().url().or(z.literal("")).optional(),
});

export type CreatePrintOrderInput = z.infer<typeof schema>;

export async function createPrintOrder(input: CreatePrintOrderInput) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid order details." };
  }

  const { businessId, quantity, hasNfc, language, logoUrl } = parsed.data;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true },
  });
  if (!business) {
    return { ok: false as const, error: "Business not found." };
  }

  await prisma.printOrder.create({
    data: {
      businessId,
      quantity,
      hasNfc,
      language,
      logoUrl: logoUrl?.trim() || null,
      status: "pending",
    },
  });

  return { ok: true as const };
}
