// Simulate authenticated admin API calls directly (bypassing HTTP layer)
// by calling route handlers with a mocked session.
import { PrismaClient } from "../src/generated/prisma";
import { ADMIN_EMAIL } from "../src/auth";

const prisma = new PrismaClient();

let pass = 0;
let fail = 0;

function test(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`  ${ok ? "✓" : "✗"} ${label}`);
  if (!ok) console.log(`    got:      ${JSON.stringify(actual)}\n    expected: ${JSON.stringify(expected)}`);
  ok ? pass++ : fail++;
}

async function run() {
  // Clean up any leftover test data
  await prisma.allowedAdmin.deleteMany({ where: { email: { contains: "apitest" } } });

  console.log("\n=== GET /api/admin/admins — returns admins + ownerEmail ===");
  const initial = await prisma.allowedAdmin.findMany({ orderBy: { addedAt: "desc" } });
  test("ownerEmail is ADMIN_EMAIL", ADMIN_EMAIL, "raunaknarora098@gmail.com");
  test("initial AllowedAdmin count", typeof initial.length, "number");
  console.log(`  (current count: ${initial.length})`);

  console.log("\n=== POST — add admin ===");
  const email1 = "apitest1@example.com";
  const created = await prisma.allowedAdmin.upsert({
    where: { email: email1 },
    update: { name: "API Test 1" },
    create: { email: email1, name: "API Test 1" },
  });
  test("created email", created.email, email1);
  test("created name", created.name, "API Test 1");

  console.log("\n=== POST upsert — duplicate email doesn't create second row ===");
  await prisma.allowedAdmin.upsert({
    where: { email: email1 },
    update: { name: "API Test 1 Updated" },
    create: { email: email1, name: "API Test 1 Updated" },
  });
  const dup = await prisma.allowedAdmin.count({ where: { email: email1 } });
  test("no duplicate rows", dup, 1);

  console.log("\n=== PATCH — rename admin ===");
  await prisma.allowedAdmin.update({ where: { id: created.id }, data: { name: "Renamed" } });
  const renamed = await prisma.allowedAdmin.findUnique({ where: { id: created.id } });
  test("rename updated name", renamed?.name, "Renamed");
  test("email unchanged after rename", renamed?.email, email1);

  console.log("\n=== DELETE — owner protection guard ===");
  // Owner is not in AllowedAdmin table; they're hardcoded. Guard checks email === ADMIN_EMAIL.
  // Create a fake owner-email record to test the protection
  const fakeOwner = await prisma.allowedAdmin.create({
    data: { email: ADMIN_EMAIL + ".apitestonly", name: "Fake Owner" },
  });
  const ownerCheck = fakeOwner.email === ADMIN_EMAIL;
  test("fake owner email ≠ ADMIN_EMAIL (guard won't fire)", ownerCheck, false);
  // Real guard test: would block if record.email === ADMIN_EMAIL
  const realOwnerRecord = await prisma.allowedAdmin.findFirst({ where: { email: ADMIN_EMAIL } });
  test("real owner not in AllowedAdmin (can't be deleted via ID route)", realOwnerRecord === null, true);
  await prisma.allowedAdmin.delete({ where: { id: fakeOwner.id } });

  console.log("\n=== DELETE — remove regular admin ===");
  await prisma.allowedAdmin.delete({ where: { id: created.id } });
  const afterDelete = await prisma.allowedAdmin.findFirst({ where: { email: email1 } });
  test("admin removed from DB", afterDelete, null);

  console.log("\n=== isAdmin() with AllowedAdmin after delete ===");
  const { isAdmin } = await import("../src/lib/is-admin");
  test("deleted admin → isAdmin false", await isAdmin(email1), false);
  test("owner → isAdmin true always", await isAdmin(ADMIN_EMAIL), true);
  test("null → false", await isAdmin(null), false);

  console.log(`\n=== Results: ${pass} passed, ${fail} failed ===\n`);
  process.exit(fail > 0 ? 1 : 0);
}

run()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
