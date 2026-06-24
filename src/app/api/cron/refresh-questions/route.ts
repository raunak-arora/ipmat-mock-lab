import { NextRequest, NextResponse } from "next/server";
import { refreshStaleQuestions } from "@/lib/question-gen";
import { sendTelegram } from "@/lib/telegram";
import { prisma } from "@/lib/db";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Verify Vercel Cron secret to prevent unauthorised calls.
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await refreshStaleQuestions();

    const totalQuestions = await prisma.question.count();

    if (result.added === 0) {
      await sendTelegram(
        `ℹ️ <b>IPMAT Question Bank — Daily Refresh</b>\n\nNo stale questions found today. Bank is fresh.\n\n📚 Total questions: ${totalQuestions}`
      );
      return NextResponse.json({ added: 0, message: "No stale questions" });
    }

    const topicLines = Object.entries(result.byTopic)
      .map(([topic, count]) => `  • ${topic} (+${count})`)
      .join("\n");

    await sendTelegram(
      `✅ <b>IPMAT Question Bank Updated</b>\n\n` +
        `Added <b>${result.added}</b> new questions:\n${topicLines}\n\n` +
        `📚 Total questions: ${totalQuestions}\n` +
        `⏭️ Skipped (failed verify): ${result.skipped}\n\n` +
        `Review new questions at:\nhttps://ipmat-mock-lab.vercel.app/admin → Browse → AI Generated`
    );

    return NextResponse.json({ added: result.added, byTopic: result.byTopic, skipped: result.skipped });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await sendTelegram(`❌ <b>IPMAT Cron Error</b>\n\n${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
