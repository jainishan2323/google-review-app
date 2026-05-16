import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Dev user
  const user = await prisma.user.upsert({
    where: { email: "dev@example.com" },
    update: {},
    create: {
      email: "dev@example.com",
      name: "Dev Owner",
      role: "OWNER",
    },
  });

  // Dev business
  const business = await prisma.business.upsert({
    where: { googleLocationId: "dev-location-001" },
    update: {},
    create: {
      name: "Spice Garden Berlin",
      googleLocationId: "dev-location-001",
      googlePlaceId: "ChIJdev0001",
      googleMapsReviewUrl: "https://g.page/r/dev-review-url",
      ownerId: user.id,
    },
  });

  console.log(`✅ Business seeded: ${business.id} — ${business.name}`);
  console.log(`   Use this businessId in your API calls: ${business.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
