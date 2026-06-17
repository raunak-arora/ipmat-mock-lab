import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/is-admin";

function normalizeForDedup(stem: string): string {
  return stem
    .trim()
    .toLowerCase()
    .replace(/\[ipmat\s+\w+\s+\d{4}\]\s*/gi, "")
    .replace(/\(ipmat\s+\w+\s+\d{4}\)\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function jaccard(a: string, b: string): number {
  const words = (s: string) => new Set(s.split(/\s+/).filter((w) => w.length > 2));
  const setA = words(a);
  const setB = words(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = [...setA].filter((w) => setB.has(w)).length;
  return intersection / new Set([...setA, ...setB]).size;
}

export async function POST(req: Request) {
  void req;
  const session = await auth();
  if (!await isAdmin(session?.user?.email))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const job = await prisma.adminJob.create({ data: { type: "DEDUP" } });

  try {
    const all = await prisma.question.findMany({
      select: { id: true, subject: true, type: true, stem: true, explanation: true },
      orderBy: { createdAt: "asc" },
    });

    const byPool = new Map<string, typeof all>();
    for (const q of all) {
      const key = `${q.subject}|${q.type}`;
      if (!byPool.has(key)) byPool.set(key, []);
      byPool.get(key)!.push(q);
    }

    const toDelete = new Set<string>();
    for (const [, group] of byPool) {
      const normed = group.map((q) => ({ ...q, norm: normalizeForDedup(q.stem) }));
      for (let i = 0; i < normed.length; i++) {
        if (toDelete.has(normed[i].id)) continue;
        for (let j = i + 1; j < normed.length; j++) {
          if (toDelete.has(normed[j].id)) continue;
          if (jaccard(normed[i].norm, normed[j].norm) >= 0.65) {
            const keepJ = !normed[i].explanation && !!normed[j].explanation;
            toDelete.add(keepJ ? normed[i].id : normed[j].id);
          }
        }
      }
    }

    const ids = [...toDelete];
    if (ids.length > 0) {
      await prisma.question.deleteMany({ where: { id: { in: ids } } });
    }

    const result = { removed: ids.length, remaining: all.length - ids.length };
    await prisma.adminJob.update({
      where: { id: job.id },
      data: { status: "DONE", finishedAt: new Date(), result: JSON.stringify(result) },
    });
    return NextResponse.json(result);
  } catch (err) {
    await prisma.adminJob.update({
      where: { id: job.id },
      data: { status: "ERROR", finishedAt: new Date(), result: JSON.stringify({ error: String(err) }) },
    });
    throw err;
  }
}
