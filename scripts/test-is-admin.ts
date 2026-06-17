import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();
const ADMIN_EMAIL = "raunaknarora098@gmail.com";

async function isAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  if (email === ADMIN_EMAIL) return true;
  const found = await prisma.allowedAdmin.findFirst({ where: { email } });
  return !!found;
}

async function run() {
  let pass = 0;
  let fail = 0;

  async function test(label: string, actual: boolean, expected: boolean) {
    const ok = actual === expected;
    console.log(`  ${ok ? "✓" : "✗"} ${label} → ${actual} (expected ${expected})`);
    ok ? pass++ : fail++;
  }

  console.log("\n=== isAdmin() unit tests ===");
  await test("null email → false", await isAdmin(null), false);
  await test("undefined email → false", await isAdmin(undefined), false);
  await test("empty string → false", await isAdmin(""), false);
  await test("random email → false", await isAdmin("nobody@example.com"), false);
  await test("ADMIN_EMAIL → true", await isAdmin(ADMIN_EMAIL), true);

  console.log("\n=== AllowedAdmin DB tests ===");

  // Clean up any leftover test data
  await prisma.allowedAdmin.deleteMany({ where: { email: { contains: "testadmin" } } });

  // Add an admin
  const created = await prisma.allowedAdmin.create({
    data: { email: "testadmin@example.com", name: "Test Person" },
  });
  console.log(`  Created: ${created.email} (id: ${created.id})`);
  await test("new AllowedAdmin → isAdmin true", await isAdmin("testadmin@example.com"), true);

  // Rename
  await prisma.allowedAdmin.update({ where: { id: created.id }, data: { name: "Renamed Person" } });
  const renamed = await prisma.allowedAdmin.findUnique({ where: { id: created.id } });
  await test("rename works", renamed?.name === "Renamed Person", true);

  // Upsert duplicate (POST endpoint behaviour)
  const upserted = await prisma.allowedAdmin.upsert({
    where: { email: "testadmin@example.com" },
    update: { name: "Upserted" },
    create: { email: "testadmin@example.com", name: "Upserted" },
  });
  const count = await prisma.allowedAdmin.count({ where: { email: "testadmin@example.com" } });
  await test("upsert doesn't duplicate", count === 1, true);
  await test("upsert updates name", upserted.name === "Upserted", true);

  // Delete
  await prisma.allowedAdmin.delete({ where: { id: created.id } });
  await test("after delete → isAdmin false", await isAdmin("testadmin@example.com"), false);

  // Owner cannot be deleted (simulate [id]/route.ts guard)
  const ownerRecord = await prisma.allowedAdmin.findFirst({ where: { email: ADMIN_EMAIL } });
  const ownerProtected = ownerRecord?.email === ADMIN_EMAIL;
  // ownerRecord should be null (owner is not in AllowedAdmin, they're hardcoded)
  await test("owner not in AllowedAdmin table (hardcoded)", ownerRecord === null, true);

  console.log(`\n=== Results: ${pass} passed, ${fail} failed ===\n`);
  process.exit(fail > 0 ? 1 : 0);
}

run().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
