import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "@prisma/client";
export {
  applyTaxonomyTemplate,
  TAXONOMY_TEMPLATES,
  BUSINESS_TYPE_OPTIONS,
  DEFAULT_BUSINESS_TYPE,
  type TaxonomyTemplate,
} from "./taxonomy-templates";
export { generateToken, normaliseToken, mintTokens } from "./qr-token";
