import { PrismaClient } from "../src/generated/prisma";
const p = new PrismaClient();
async function main() {
  // Full Venn diagram question
  const venn = await p.question.findUnique({ where:{id:"cmqdsj4ic0081ul51eet5ijro"}, select:{stem:true,options:true,answer:true,explanation:true}});
  console.log("=== VENN ==="); console.log(venn?.stem); console.log("options:", venn?.options); console.log("answer:", venn?.answer); console.log("explanation:", venn?.explanation);

  // Full blood relations question  
  const blood = await p.question.findUnique({ where:{id:"cmqdsiqu4006iul51egu8qcpu"}, select:{stem:true,options:true,answer:true,explanation:true}});
  console.log("\n=== BLOOD ==="); console.log(blood?.stem); console.log("options:", blood?.options); console.log("answer:", blood?.answer); console.log("explanation:", blood?.explanation);
}
main().catch(console.error).finally(() => p.$disconnect());
