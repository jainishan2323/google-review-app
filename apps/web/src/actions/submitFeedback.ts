"use server";

import { prisma } from "@repo/db";
import { revalidatePath } from "next/cache";

export async function submitPrivateFeedback(formData: FormData) {
  const businessId = formData.get("businessId");
  const ratingRaw = formData.get("rating");
  const text = formData.get("text");

  if (!businessId || typeof businessId !== "string" || businessId.trim() === "") {
    throw new Error("businessId is required");
  }

  const rating = Number(ratingRaw);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("rating must be an integer between 1 and 5");
  }

  await prisma.anonymousFeedback.create({
    data: {
      businessId: businessId.trim(),
      rating,
      text: typeof text === "string" && text.trim() !== "" ? text.trim() : null,
      status: "unread",
    },
  });

  revalidatePath("/dashboard/feedback");
}
