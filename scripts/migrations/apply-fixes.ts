import { PrismaClient } from "../../src/generated/prisma";
const p = new PrismaClient();
async function main() {
  await p.question.update({ where:{id:"cmqdsfvg90000ul51pmyh3lgz"}, data:{
    answer: "3",
    explanation: "The unit digits of powers of 7 follow a cycle of 4: 7¹→7, 7²→9, 7³→3, 7⁴→1, then repeats. 95 = 4×23 + 3, so the unit digit is the 3rd in the cycle = 3.",
  }});
  console.log("✓ 7^95: answer 7 → 3");

  await p.question.update({ where:{id:"cmqdsj4ic0081ul51eet5ijro"}, data:{
    answer: "45",
    explanation: "Only Math = 35 − (20+10−5) = 10. Only Science = 45 − (20+15−5) = 15. Only English = 40 − (10+15−5) = 20. Total exactly one = 10+15+20 = 45. Verification: exactly two = 15+10+5 = 30. Total = 45+30+5 = 80 ✓.",
  }});
  console.log("✓ Venn diagram: answer 35 → 45");

  await p.question.update({ where:{id:"cmqdsh4wk0016ul51ddtq7omc"}, data:{
    answer: "1/7",
    explanation: "P(both red) = P(1st red) × P(2nd red | 1st red) = (3/7) × (2/6) = 6/42 = 1/7.",
  }});
  console.log("✓ Probability: answer 1/3 → 1/7");

  await p.question.update({ where:{id:"cmqdsiqu4006iul51egu8qcpu"}, data:{
    options: JSON.stringify(["X ^ Y * Z","Z * Y ^ X","X * Y ^ Z","X ^ Y ^ Z"]),
    answer: "X ^ Y ^ Z",
    explanation: "X is the paternal grandfather of Z means: X is the father of Y (X ^ Y) AND Y is the father of Z (Y ^ Z). Combined: X ^ Y ^ Z.",
  }});
  console.log("✓ Blood relations: added X^Y^Z as option, set as answer");

  await p.question.update({ where:{id:"cmqdshctw001wul51kfh5adty"}, data:{
    options: JSON.stringify(["1.657","1.757","1.857","1.957"]),
  }});
  console.log("✓ log 72: replaced 4× duplicate options with distinct distractors");
}
main().catch(console.error).finally(() => p.$disconnect());
