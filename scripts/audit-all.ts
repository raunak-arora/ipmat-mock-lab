import { PrismaClient } from "../src/generated/prisma";
const p = new PrismaClient();

function norm(s: string) { return s.trim().toLowerCase().replace(/\s+/g, " "); }
function stripTags(s: string) {
  return s.replace(/\[ipmat\s+\w+\s+\d{4}\]\s*/gi,"").replace(/\(ipmat\s+\w+\s+\d{4}\)\s*/gi,"").trim();
}

async function main() {
  const all = await p.question.findMany({
    select: { id:true, subject:true, type:true, topic:true, difficulty:true, stem:true, options:true, answer:true, explanation:true },
  });

  const issues: { id:string; issueType:string; detail:string; stem:string; answer:string; subject:string; topic:string }[] = [];

  for (const q of all) {
    const strippedStem = stripTags(q.stem);

    if (q.explanation) {
      const expLower = q.explanation.toLowerCase();
      const hasCorrectionMarker =
        /\bcorrection\s*:/i.test(q.explanation) || /\bwait\s*[—–-]/i.test(q.explanation) ||
        /\bshould\s+be\b/i.test(q.explanation) || /\bactually\s+(?:the\s+)?(?:correct\s+)?answer\b/i.test(q.explanation);

      let numericMismatch: string|null = null;
      if (q.type === "SHORT_ANSWER") {
        const m = expLower.match(/(?:(?:unit\s+digit|answer)\s+(?:is|=)\s*|=\s*)(\d+(?:\.\d+)?)\s*\.?\s*$/);
        if (m && m[1] !== q.answer.trim().toLowerCase()) numericMismatch = m[1];
      }
      let mcqMismatch: string|null = null;
      if (q.type === "MCQ") {
        const m = expLower.match(/(?:correction[:\s]+answer\s+is\s*|correct\s+answer\s+is\s*)(\d+(?:\.\d+)?|\w+)/);
        if (m && norm(m[1].trim()) !== norm(q.answer)) mcqMismatch = m[1].trim();
      }
      if (hasCorrectionMarker || numericMismatch || mcqMismatch) {
        const detail = numericMismatch ? `Explanation says answer=${numericMismatch} but stored="${q.answer}"`
          : mcqMismatch ? `Explanation says answer="${mcqMismatch}" but stored="${q.answer}"`
          : `Self-correction marker — stored answer "${q.answer}" may be wrong`;
        issues.push({ id:q.id, issueType:"explanation_contradicts_answer", detail, stem:q.stem.slice(0,80), answer:q.answer, subject:q.subject, topic:q.topic });
      }
    }

    if (!q.explanation || q.explanation.trim()==="")
      issues.push({ id:q.id, issueType:"missing_explanation", detail:"No explanation", stem:q.stem.slice(0,80), answer:q.answer, subject:q.subject, topic:q.topic });

    if (strippedStem.length < 15)
      issues.push({ id:q.id, issueType:"short_stem", detail:`Only ${strippedStem.length} chars`, stem:q.stem.slice(0,80), answer:q.answer, subject:q.subject, topic:q.topic });

    if (q.type !== "MCQ") continue;
    const opts: string[] = q.options ? JSON.parse(q.options) : [];
    if (opts.length < 4) { issues.push({ id:q.id, issueType:"too_few_options", detail:`${opts.length} options`, stem:q.stem.slice(0,80), answer:q.answer, subject:q.subject, topic:q.topic }); continue; }
    const labelRe = /^[A-D]$/;
    const labelOpt = opts.find(o => labelRe.test(o.trim()));
    if (labelOpt) { issues.push({ id:q.id, issueType:"option_is_label", detail:`Option "${labelOpt}" is a label`, stem:q.stem.slice(0,80), answer:q.answer, subject:q.subject, topic:q.topic }); continue; }
    const normedOpts = opts.map(norm);
    const seen = new Set<string>(); let dup: string|null = null;
    for (const no of normedOpts) { if (seen.has(no)) { dup=no; break; } seen.add(no); }
    if (dup) { issues.push({ id:q.id, issueType:"duplicate_options", detail:`Dup: "${dup}"`, stem:q.stem.slice(0,80), answer:q.answer, subject:q.subject, topic:q.topic }); continue; }
    let candidates: string[];
    try { const parsed=JSON.parse(q.answer); candidates=Array.isArray(parsed)?parsed.map(String):[q.answer]; } catch { candidates=[q.answer]; }
    if (!candidates.some(c => normedOpts.some(no => no===norm(String(c)))))
      issues.push({ id:q.id, issueType:"answer_not_in_options", detail:`Answer "${q.answer}" not in options`, stem:q.stem.slice(0,80), answer:q.answer, subject:q.subject, topic:q.topic });
  }

  // Group by issue type
  const byType: Record<string, typeof issues> = {};
  for (const i of issues) { (byType[i.issueType]??=[]).push(i); }

  console.log(`\n====== AUDIT RESULTS: ${all.length} questions, ${issues.length} issues ======\n`);
  for (const [type, list] of Object.entries(byType)) {
    console.log(`\n--- ${type} (${list.length}) ---`);
    for (const i of list) {
      console.log(`  [${i.subject}/${i.topic}] ${i.stem}`);
      console.log(`    stored answer: "${i.answer}" | ${i.detail}`);
      console.log(`    id: ${i.id}`);
    }
  }
}
main().catch(console.error).finally(() => p.$disconnect());
