"use server";

import { prisma } from "@repo/db";
import { revalidatePath } from "next/cache";

export async function markPrintOrderFulfilled(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || id.trim() === "") {
    throw new Error("Print order id is required");
  }

  await prisma.printOrder.update({
    where: { id },
    data: { status: "fulfilled", fulfilledAt: new Date() },
  });

  revalidatePath("/dashboard/print-orders");
}
