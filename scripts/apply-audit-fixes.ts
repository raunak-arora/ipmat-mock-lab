import { PrismaClient } from "../src/generated/prisma";
const p = new PrismaClient();

async function main() {
  // 1 — Floor building, floor 4 = K
  await p.question.update({
    where: { id: "cmqdsipqq006eul51t1bu37c9" },
    data: {
      answer: "K",
      explanation: "Odd floors shift up (+1): J(1→2), K(3→4), O(5→6). Even floors shift down (−1): L(2→1), M(4→3), N(6→5). New arrangement: Floor1=L, Floor2=J, Floor3=M, Floor4=K, Floor5=N, Floor6=O. Floor 4 = K.",
    },
  });
  console.log("1. Floor building: O → K");

  // 2 — Coded blood relations, A is D's father
  await p.question.update({
    where: { id: "cmqdsiqkm006hul51vnvms2d1" },
    data: {
      answer: "Father",
      explanation: "A # B = A is the husband of B. B $ C = B is the mother of C. C @ D = C is the sister of D, so D is also B's child. A (husband of B) is the father of D (B's child). Answer: Father.",
    },
  });
  console.log("2. Blood relations: Uncle → Father");

  // 3 — Number coding 7 3 4 6 9, both ends odd → condition (ii)
  await p.question.update({
    where: { id: "cmqdsivye0073ul5100ntb5vz" },
    data: {
      answer: "@ 3 4 6 @",
      explanation: "Number: 7 3 4 6 9. First digit = 7 (odd), Last digit = 9 (odd). Both ends odd → condition (ii): code both as '@'. Answer: @ 3 4 6 @.",
    },
  });
  console.log("3. Number coding: 9 3 4 6 7 → @ 3 4 6 @");

  // 4 — Teams, E is in Team X must be true
  await p.question.update({
    where: { id: "cmqdsj09x007kul51vgjq3bda" },
    data: {
      answer: "E is in Team X",
      explanation: "C is fixed in Team X. A and B cannot share a team. Working through valid assignments, E must always be in Team X. 'D is in Team Y' is false in valid arrangements. Answer: E is in Team X.",
    },
  });
  console.log("4. Teams: D is in Team Y → E is in Team X");

  // 5 — Perfect square factors = 18
  await p.question.update({
    where: { id: "cmqf5qhu1003gulhgs5x62540" },
    data: {
      answer: "18",
      explanation: "Perfect square factors require all prime exponents to be even. 2 (max exp 5): choices 0,2,4 → 3. 3 (max exp 4): choices 0,2,4 → 3. 5 (max exp 3): choices 0,2 → 2. Total = 3 × 3 × 2 = 18.",
    },
  });
  console.log("5. Perfect square factors: 12 → 18");

  // 6 — Saurabh walks, distance = 140 m
  await p.question.update({
    where: { id: "cmqev8ctj000yulawj6l03iuk" },
    data: {
      answer: "140 metres",
      explanation: "Start (0,0) facing South. Walk 80S → (0,−80). Turn right (West). Walk 80W → (−80,−80). Turn left (South). Walk 60S → (−80,−140). Turn left (East). Walk 80E → (0,−140). Distance from start = 140 metres.",
    },
  });
  console.log("6. Saurabh walks: 60 → 140 metres");

  // 7 — Circular seating, 3rd right of M = O
  await p.question.update({
    where: { id: "cmqf5thle00inulhgomqa8anp" },
    data: {
      answer: "O",
      explanation: "Clockwise arrangement: R(1)-M(2)-N(3)-Q(4)-O(5)-P(6). Third to the right (clockwise) of M(2): 1st=N(3), 2nd=Q(4), 3rd=O(5). Answer: O.",
    },
  });
  console.log("7. Circular seating: N → O");

  // 8 — Vaccine boxes: Pfizer is above AstraZeneca after swap
  await p.question.update({
    where: { id: "cmqf5tqmj00jzulhgc3vzven3" },
    data: {
      options: JSON.stringify(["Sputnik", "Pfizer", "Moderna", "Covishield"]),
      answer: "Pfizer",
      explanation: "After Moderna(4) and Pfizer(6) swap: Sputnik(1)-Covishield(2)-AstraZeneca(3)-Pfizer(4)-Covaxin(5)-Moderna(6). Box just above AstraZeneca(3) is now Pfizer at position 4. Answer: Pfizer.",
    },
  });
  console.log("8. Vaccine boxes: Moderna → Pfizer (options fixed)");

  // 9 — Eight boxes, Box A has 3 below it
  await p.question.update({
    where: { id: "cmqf5tt7g00kculhgmfyb7uat" },
    data: {
      answer: "Box A",
      explanation: "Top to bottom: D(1)-C(2)-E(3)-G(4)-A(5)-B(6)-H(7)-F(8). Boxes above G = D,C,E = 3. Box A at position 5 has B,H,F below it = 3. Same count. Answer: Box A.",
    },
  });
  console.log("9. Eight boxes: Box D → Box A");

  // 10 — Stem typo: "2nd to the left" → "immediately to the left"
  await p.question.update({
    where: { id: "cmqf5ttqy00kfulhg4yd1qjdc" },
    data: {
      stem: "Eight persons sit in a row facing north. Arrangement: D(1)-C(2)-A(3)-E(4)-G(5)-B(6)-F(7)-H(8).\n\nWho sits immediately to the left of F?",
      explanation: "F is at position 7. Immediately to the left = position 6 = B. Answer: B.",
    },
  });
  console.log("10. Row seating stem: '2nd to left' → 'immediately to the left'");

  // 11 — SCHOOL coding: XHMTTQ, fix options
  await p.question.update({
    where: { id: "cmqf5u0a10005ulz2dnspix1n" },
    data: {
      options: JSON.stringify(["XHMRPQ", "XHNSQP", "XHMTTQ", "XHNRPQ"]),
      answer: "XHMTTQ",
      explanation: "Each letter shifts +5. Verify: B+5=G, R+5=W, O+5=T, T+5=Y, H+5=M, E+5=J, R+5=W → GWTYMJW ✓. SCHOOL: S+5=X, C+5=H, H+5=M, O+5=T, O+5=T, L+5=Q → XHMTTQ. Answer: XHMTTQ.",
    },
  });
  console.log("11. SCHOOL coding: XHMRQP → XHMTTQ (options fixed)");

  // 12 & 13 — IPMAT 2023 inequality (two copies)
  const inequalityExpl =
    "x² ≥ 0 and (2x+1)² ≥ 0 always; zero only at x=0 and x=−1/2. The sign is controlled by (x+1)(x-1), which is positive when x < −1 or x > 1. In those regions x=0 and x=−1/2 are excluded automatically. Answer: (−∞,−1) ∪ (1,∞).";
  await p.question.update({
    where: { id: "cmqf5u2mu0047ulz25k16zp19" },
    data: { answer: "(-∞,-1) ∪ (1,∞)", explanation: inequalityExpl },
  });
  console.log("12. Inequality copy 1: (-1,-1/2)∪(1,∞) → (-∞,-1)∪(1,∞)");

  await p.question.update({
    where: { id: "cmqf5usen00phulhg3bcj65nu" },
    data: { answer: "(-∞,-1) ∪ (1,∞)", explanation: inequalityExpl },
  });
  console.log("13. Inequality copy 2 (duplicate): same fix");

  // 14 — B's profit = Rs. 5,400; fix options
  await p.question.update({
    where: { id: "cmqf5rto300a5ulhg6ax4gmko" },
    data: {
      options: JSON.stringify(["Rs. 3,240", "Rs. 4,200", "Rs. 5,400", "Rs. 4,840"]),
      answer: "Rs. 5,400",
      explanation: "Total profit = Rs. 9,600. A's management fee = 10% = Rs. 960. Remaining = Rs. 8,640 split 3:5 (capital 12,000:20,000). B's share = (5/8) × 8,640 = Rs. 5,400. Answer: Rs. 5,400.",
    },
  });
  console.log("14. B's profit: Rs. 4,200 → Rs. 5,400 (options fixed)");

  console.log("\nAll 14 fixes applied.");
}

main().catch(console.error).finally(() => p.$disconnect());
