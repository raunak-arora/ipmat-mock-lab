import { PrismaClient } from "../src/generated/prisma";
const p = new PrismaClient();

async function main() {
  // 1. Check the 3 answer_not_in_options — read their full options
  const ids = ["cmqdsh4wk0016ul51ddtq7omc","cmqdsiqu4006iul51egu8qcpu","cmqf5u2mv004uulz2m7lcny6c"];
  for (const id of ids) {
    const q = await p.question.findUnique({ where: {id}, select: {stem:true, options:true, answer:true, explanation:true}});
    console.log(`\n--- ANSWER_NOT_IN_OPTIONS: ${q?.stem?.slice(0,70)} ---`);
    console.log("answer:", q?.answer);
    console.log("options:", q?.options);
    console.log("explanation (first 200):", q?.explanation?.slice(0,200));
  }

  // 2. Check the duplicate_options question
  const dq = await p.question.findUnique({ where: {id:"cmqdshctw001wul51kfh5adty"}, select:{stem:true,options:true,answer:true,explanation:true}});
  console.log(`\n--- DUPLICATE_OPTIONS: ${dq?.stem} ---`);
  console.log("options:", dq?.options);
  console.log("answer:", dq?.answer);
  console.log("explanation:", dq?.explanation?.slice(0,300));

  // 3. Check 5 option_is_label LR ones — are these legitimately person names?
  const lrIds = ["cmqcouusp003tulkks3ec0pcv","cmqdsh98z001mul51cxa90abd","cmqdsicvn0052ul519kzn6sg7"];
  for (const id of lrIds) {
    const q = await p.question.findUnique({ where: {id}, select:{stem:true,options:true,answer:true,subject:true,topic:true}});
    console.log(`\n--- OPTION_IS_LABEL [${q?.subject}/${q?.topic}]: ${q?.stem?.slice(0,70)} ---`);
    console.log("options:", q?.options);
    console.log("answer:", q?.answer);
  }

  // 4. Check the high-confidence explanation_contradicts_answer ones
  const mismatchIds = [
    "cmqdsfvg90000ul51pmyh3lgz", // 7^95
    "cmqdsj4ic0081ul51eet5ijro", // Venn Diagrams says 45 stored 35
    "cmqf5q2vj001dulhgns67iin8", // 81^x says 3 stored "(−∞,1/4)"
  ];
  for (const id of mismatchIds) {
    const q = await p.question.findUnique({ where:{id}, select:{stem:true,answer:true,options:true,explanation:true}});
    console.log(`\n--- MISMATCH: ${q?.stem?.slice(0,70)} ---`);
    console.log("stored answer:", q?.answer);
    console.log("options:", q?.options);
    console.log("explanation:", q?.explanation?.slice(0,300));
  }
}
main().catch(console.error).finally(() => p.$disconnect());
