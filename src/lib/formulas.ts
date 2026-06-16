export interface FormulaEntry {
  label: string;
  formula?: string;
  note?: string;
}

export interface TopicSheet {
  topic: string;
  subject: "QUANT" | "VERBAL" | "LR";
  entries: FormulaEntry[];
}

export const FORMULA_SHEETS: TopicSheet[] = [
  /* ── QUANT ── */
  {
    topic: "Number System",
    subject: "QUANT",
    entries: [
      { label: "HCF × LCM", formula: "HCF(a,b) × LCM(a,b) = a × b" },
      { label: "Divisibility by 4", note: "Last 2 digits divisible by 4" },
      { label: "Divisibility by 8", note: "Last 3 digits divisible by 8" },
      { label: "Divisibility by 9/3", note: "Sum of all digits divisible by 9 (or 3)" },
      { label: "Divisibility by 11", note: "(Sum of odd-position digits) − (sum of even-position digits) = 0 or multiple of 11" },
      { label: "Number of factors", formula: "n = aᵖ × bᵍ × … → factors = (p+1)(q+1)…" },
      { label: "Units digit cycles", note: "2: 2,4,8,6 (cycle 4) · 3: 3,9,7,1 · 7: 7,9,3,1 · 8: 8,4,2,6 · 4: 4,6 · 9: 9,1" },
      { label: "Perfect square", note: "Has an odd number of factors; units digit can only be 0,1,4,5,6,9" },
      { label: "Sum of first n natural numbers", formula: "1+2+…+n = n(n+1)/2" },
    ],
  },
  {
    topic: "Algebra",
    subject: "QUANT",
    entries: [
      { label: "(a+b)²", formula: "(a+b)² = a² + 2ab + b²" },
      { label: "(a−b)²", formula: "(a−b)² = a² − 2ab + b²" },
      { label: "Difference of squares", formula: "a² − b² = (a+b)(a−b)" },
      { label: "(a+b)³", formula: "(a+b)³ = a³ + 3a²b + 3ab² + b³" },
      { label: "Sum of cubes", formula: "a³ + b³ = (a+b)(a² − ab + b²)" },
      { label: "Difference of cubes", formula: "a³ − b³ = (a−b)(a² + ab + b²)" },
      { label: "Quadratic formula", formula: "x = (−b ± √(b²−4ac)) / 2a" },
      { label: "Roots of ax²+bx+c=0", formula: "Sum of roots = −b/a · Product of roots = c/a" },
      { label: "AM–GM inequality", formula: "AM ≥ GM ≥ HM  (for positive reals)" },
    ],
  },
  {
    topic: "Arithmetic",
    subject: "QUANT",
    entries: [
      { label: "Percentage change", formula: "% change = ((new − old) / old) × 100" },
      { label: "Profit & Loss", formula: "Profit% = (Profit/CP)×100 · SP = CP×(100+P%)/100" },
      { label: "Successive discounts", formula: "Net discount = a + b − ab/100" },
      { label: "Simple Interest", formula: "SI = (P × R × T) / 100" },
      { label: "Compound Interest", formula: "CI = P(1 + r/100)ⁿ − P" },
      { label: "CI−SI for 2 years", formula: "CI − SI = P(r/100)²" },
      { label: "Distance", formula: "Speed × Time = Distance" },
      { label: "Average speed (same distance)", formula: "Avg speed = 2S₁S₂ / (S₁+S₂)" },
      { label: "Relative speed", formula: "Same direction: |S₁−S₂| · Opposite: S₁+S₂" },
      { label: "Work rate", formula: "A in 'a' days + B in 'b' days → together in ab/(a+b) days" },
      { label: "Alligation (mixture)", formula: "w₁/w₂ = (C₂−M) / (M−C₁)  [M = desired concentration]" },
    ],
  },
  {
    topic: "Geometry & Mensuration",
    subject: "QUANT",
    entries: [
      { label: "Pythagoras theorem", formula: "a² + b² = c²  (c = hypotenuse)" },
      { label: "Pythagorean triples", note: "3-4-5 · 5-12-13 · 8-15-17 · 7-24-25" },
      { label: "Triangle area", formula: "Area = ½ × base × height = √(s(s−a)(s−b)(s−c))  where s=(a+b+c)/2" },
      { label: "Circle", formula: "Area = πr² · Circumference = 2πr" },
      { label: "Sector", formula: "Area = (θ/360)×πr² · Arc length = (θ/360)×2πr" },
      { label: "Rectangle diagonal", formula: "d = √(l²+b²)" },
      { label: "Trapezium area", formula: "Area = ½ × (a+b) × h  [a,b = parallel sides]" },
      { label: "Cube", formula: "Volume = a³ · Surface area = 6a²" },
      { label: "Cuboid", formula: "Volume = l×b×h · SA = 2(lb+bh+lh)" },
      { label: "Cylinder", formula: "Volume = πr²h · Curved SA = 2πrh" },
      { label: "Cone", formula: "Volume = ⅓πr²h · Slant l = √(r²+h²) · Curved SA = πrl" },
      { label: "Sphere", formula: "Volume = (4/3)πr³ · SA = 4πr²" },
      { label: "Circle angle rules", note: "Angle in semicircle = 90° · Inscribed angle = ½ × central angle" },
    ],
  },
  {
    topic: "Modern Maths",
    subject: "QUANT",
    entries: [
      { label: "Permutations", formula: "ⁿPᵣ = n! / (n−r)!" },
      { label: "Combinations", formula: "ⁿCᵣ = n! / (r! × (n−r)!) = ⁿC(n−r)" },
      { label: "Circular permutations", formula: "(n−1)! for distinct items; (n−1)!/2 for a necklace" },
      { label: "Repeated elements", formula: "n! / (p! × q! × …)  [divide by factorials of repeat counts]" },
      { label: "Addition rule", formula: "P(A∪B) = P(A) + P(B) − P(A∩B)" },
      { label: "Complementary event", formula: "P(Aᶜ) = 1 − P(A)" },
      { label: "Conditional probability", formula: "P(A|B) = P(A∩B) / P(B)" },
      { label: "Independent events", formula: "P(A∩B) = P(A) × P(B)" },
    ],
  },
  {
    topic: "Statistics",
    subject: "QUANT",
    entries: [
      { label: "Mean", formula: "Mean = (Σxᵢ) / n" },
      { label: "Weighted mean", formula: "= (Σwᵢxᵢ) / (Σwᵢ)" },
      { label: "Median", note: "Sort data; median = middle value (odd n) or avg of two middle values (even n)" },
      { label: "Mode", note: "Most frequently occurring value" },
      { label: "Range", formula: "Range = max − min" },
      { label: "Variance", formula: "σ² = Σ(xᵢ − mean)² / n" },
      { label: "Standard deviation", formula: "σ = √Variance" },
    ],
  },
  {
    topic: "Data Interpretation",
    subject: "QUANT",
    entries: [
      { label: "% of total", formula: "(Part / Total) × 100" },
      { label: "% change", formula: "((New − Old) / Old) × 100" },
      { label: "Compounded growth", formula: "Final = Initial × (1 + r/100)ⁿ" },
      { label: "Ratio comparison tip", note: "Cross-multiply to compare fractions: a/b vs c/d → check if a×d > b×c" },
      { label: "Index numbers", formula: "Index = (Current value / Base value) × 100" },
    ],
  },
  {
    topic: "Logarithms & Surds",
    subject: "QUANT",
    entries: [
      { label: "Product rule", formula: "log_a(xy) = log_a(x) + log_a(y)" },
      { label: "Quotient rule", formula: "log_a(x/y) = log_a(x) − log_a(y)" },
      { label: "Power rule", formula: "log_a(xⁿ) = n × log_a(x)" },
      { label: "Change of base", formula: "log_b(x) = log(x) / log(b)" },
      { label: "Special values", formula: "log_a(a) = 1 · log_a(1) = 0 · log(10) = 1 · ln(e) = 1" },
      { label: "Surd product", formula: "√a × √b = √(ab) · ⁿ√(aᵐ) = a^(m/n)" },
      { label: "Rationalization", formula: "(√a+√b)(√a−√b) = a − b" },
      { label: "Exponent rules", formula: "aᵐ×aⁿ = a^(m+n) · aᵐ/aⁿ = a^(m−n) · (aᵐ)ⁿ = a^(mn)" },
    ],
  },
  {
    topic: "Functions & Progressions",
    subject: "QUANT",
    entries: [
      { label: "AP — nth term", formula: "aₙ = a + (n−1)d" },
      { label: "AP — sum", formula: "Sₙ = n/2 × (2a + (n−1)d) = n/2 × (first + last)" },
      { label: "GP — nth term", formula: "aₙ = a × r^(n−1)" },
      { label: "GP — sum (finite)", formula: "Sₙ = a(rⁿ−1)/(r−1)  [r ≠ 1]" },
      { label: "GP — sum (infinite)", formula: "S∞ = a/(1−r)  [|r| < 1]" },
      { label: "Means", formula: "AM = (a+b)/2 · GM = √(ab) · HM = 2ab/(a+b)" },
      { label: "AM ≥ GM ≥ HM", note: "Always true for positive reals; equality when a = b" },
      { label: "Sum of squares", formula: "1²+2²+…+n² = n(n+1)(2n+1)/6" },
      { label: "Sum of cubes", formula: "1³+2³+…+n³ = [n(n+1)/2]²" },
    ],
  },

  /* ── VERBAL ── */
  {
    topic: "Reading Comprehension",
    subject: "VERBAL",
    entries: [
      { label: "Skimming technique", note: "Read first and last sentence of each paragraph to grasp the gist before diving in" },
      { label: "Main idea questions", note: "Correct answer must cover the WHOLE passage, not just one part" },
      { label: "Inference questions", note: "Choose what MUST be true from the text — not what might be, or what you believe" },
      { label: "Tone words", note: "Critical · Appreciative · Nostalgic · Satirical · Objective · Sceptical · Optimistic · Pessimistic" },
      { label: "Author's purpose", note: "Inform / Persuade / Criticise / Describe — look for emotive language as a clue" },
      { label: "Vocabulary in context", note: "Use surrounding sentences to determine meaning; don't rely on prior definitions" },
    ],
  },
  {
    topic: "Vocabulary",
    subject: "VERBAL",
    entries: [
      { label: "Prefixes — negation", note: "un-, in-, im-, il-, ir-, dis-, non-, a- all mean 'not'" },
      { label: "Prefixes — time/order", note: "pre- = before · post- = after · re- = again · ex- = out/former" },
      { label: "Prefixes — degree", note: "over- = too much · under- = too little · super-/ultra- = beyond" },
      { label: "Common roots", note: "-rupt = break · -dict = say · -spec/-spect = see · -port = carry · -mit/-miss = send · -graph = write" },
      { label: "More roots", note: "-cred = believe · -aud = hear · -bene = good · -mal = bad · -luc = light · -vert = turn" },
      { label: "Suffixes", note: "-tion/-sion = act/state · -ous = full of · -ive = tending to · -fy = to make · -ize = to become · -ist = one who" },
    ],
  },
  {
    topic: "Grammar",
    subject: "VERBAL",
    entries: [
      { label: "Subject-verb agreement", note: "Identify the true subject — ignore prepositional phrases between subject and verb" },
      { label: "Either…or / Neither…nor", note: "Verb agrees with the nearer subject: 'Neither the students nor the teacher IS ready'" },
      { label: "Collective nouns", note: "Take singular verb when acting as one unit (the team wins); plural when acting individually" },
      { label: "Who vs Whom", note: "Who = subject (replaces he/she/they) · Whom = object (replaces him/her/them)" },
      { label: "That vs Which", note: "That = restrictive (no comma) · Which = non-restrictive (use a comma before it)" },
      { label: "Less vs Fewer", note: "Fewer = countable nouns (fewer errors) · Less = uncountable (less water)" },
      { label: "Parallelism", note: "Coordinate elements must use the same grammatical form: 'She likes running, swimming, and cycling'" },
      { label: "Misplaced modifier", note: "The modifier must be placed immediately next to what it modifies" },
    ],
  },
  {
    topic: "Para Jumbles",
    subject: "VERBAL",
    entries: [
      { label: "Finding the opener", note: "No pronoun reference to something outside · Introduces a topic · Uses 'A/An' (not 'The') for first mention" },
      { label: "Finding the closer", note: "Has a concluding connector: therefore, thus, hence, in conclusion, finally" },
      { label: "Pronoun rule", note: "A pronoun must always follow its antecedent — 'he/she/it/they' links back to a named noun" },
      { label: "Logical connectors", note: "first, then, later (time) · however, but, yet (contrast) · consequently, thus (cause-effect)" },
      { label: "Demonstratives", note: "'This/These/Such' links back to the immediately preceding sentence — use to chain sentences" },
    ],
  },
  {
    topic: "Sentence Correction",
    subject: "VERBAL",
    entries: [
      { label: "Priority check order", note: "1) Subject-verb agreement 2) Pronoun reference 3) Verb tense 4) Idiom 5) Parallel structure" },
      { label: "Common idioms", note: "'between … and' (not 'between … to') · 'different from' (not 'different than') · 'superior to'" },
      { label: "Redundancy", note: "Remove duplicates: 'past history', 'free gift', 'future plans', 'end result', 'completely destroyed'" },
      { label: "Tense consistency", note: "Narrative in past tense stays past; shift only for universal truths or habitual actions" },
      { label: "Dangling participle", note: "Opening participial phrase must refer to the subject of the main clause" },
    ],
  },
  {
    topic: "Idioms & Phrases",
    subject: "VERBAL",
    entries: [
      { label: "At the drop of a hat", note: "Immediately, without hesitation" },
      { label: "Bite the bullet", note: "Endure a painful/difficult situation stoically" },
      { label: "Burn bridges", note: "Permanently destroy a relationship or future opportunity" },
      { label: "Costs an arm and a leg", note: "Extremely expensive" },
      { label: "Hit the nail on the head", note: "Describe something exactly correctly" },
      { label: "Let the cat out of the bag", note: "Accidentally reveal a secret" },
      { label: "Under the weather", note: "Feeling ill or unwell" },
      { label: "Beat around the bush", note: "Avoid coming to the main point" },
      { label: "Sitting on the fence", note: "Refusing to commit to one side of an argument" },
      { label: "Spill the beans", note: "Reveal confidential information" },
    ],
  },
  {
    topic: "Para Completion",
    subject: "VERBAL",
    entries: [
      { label: "Match tone & direction", note: "If the paragraph is critical, the completion should continue that — not shift to praise" },
      { label: "No new ideas", note: "Reject options that introduce a concept not hinted at anywhere in the paragraph" },
      { label: "Logical culmination", note: "The best last sentence is one that the passage was building towards" },
      { label: "Connectors as clues", note: "If the last sentence you have ends with 'however', the completion should present a contrast" },
    ],
  },
  {
    topic: "Verbal Analogies",
    subject: "VERBAL",
    entries: [
      { label: "Identify the relationship first", note: "Say it in a sentence: 'A is a part of B' or 'A is the tool used by B'" },
      { label: "Relationship types", note: "Part-whole · Cause-effect · Item-category · Degree (hot:scalding) · Tool-use · Worker-product · Antonym · Synonym" },
      { label: "Check directionality", note: "A:B::C:D — the direction of the relationship must be the same in both pairs" },
      { label: "Grammar match", note: "Noun:Noun or Verb:Verb — ensure the same parts of speech across both pairs" },
      { label: "Beware of stem-echo traps", note: "An option that contains a word from the stem is usually a distractor — verify the semantic relationship" },
    ],
  },

  /* ── LR ── */
  {
    topic: "Arrangements & Seating",
    subject: "LR",
    entries: [
      { label: "Linear arrangement", formula: "n people → n! arrangements" },
      { label: "Circular arrangement", formula: "(n−1)! for distinct items; fix one person, arrange rest" },
      { label: "Necklace/garland", formula: "(n−1)! / 2  (flip = same)" },
      { label: "Rows facing each other", note: "The 'left' and 'right' of the opposite row are reversed relative to you" },
      { label: "General approach", note: "Draw a diagram · Use direct clues first · Then use relative clues to fill gaps" },
    ],
  },
  {
    topic: "Blood Relations",
    subject: "LR",
    entries: [
      { label: "Generational notation", note: "Two levels up = grandparent · One up = parent · Same level = sibling/cousin · One down = child" },
      { label: "Gender markers", note: "'his' → the person referred to is male · 'her' → female" },
      { label: "Common patterns", note: "'X's sister's husband' = X's brother-in-law · 'A's father's only son' = A himself" },
      { label: "Step-by-step rule", note: "Always resolve one relationship at a time — never skip links" },
      { label: "Coded blood relations", note: "Decode the symbols first (e.g. + = male, − = female, × = sibling) then draw the tree" },
    ],
  },
  {
    topic: "Syllogisms",
    subject: "LR",
    entries: [
      { label: "All A is B", note: "A ⊂ B (every A is inside B)" },
      { label: "No A is B", note: "A ∩ B = ∅ (A and B have no overlap)" },
      { label: "Some A is B", note: "A ∩ B ≠ ∅ (at least one A is in B)" },
      { label: "Some A is not B", note: "Part of A lies outside B — does not mean all A is outside" },
      { label: "Definite vs possible", note: "'Definitely true' needs to hold in ALL valid Venn diagrams; 'possibly true' needs just one" },
      { label: "Complementary pair", note: "'Some A is B' and 'No A is B' are complementary — exactly one is always true" },
    ],
  },
  {
    topic: "Coding-Decoding",
    subject: "LR",
    entries: [
      { label: "Letter shift", note: "Identify constant shift: if A→D, shift = +3 for all letters" },
      { label: "Reverse alphabet", note: "Reverse code: A=26, B=25, …, Z=1. Or simply reverse: A↔Z, B↔Y, …" },
      { label: "Position-based", note: "Odd letters shift one way, even letters another — check separately" },
      { label: "Word coding", note: "Write all coded sentences and find which word maps to which by common position" },
      { label: "Number coding", note: "A=1, B=2, …, Z=26 is the default; look for modifications (multiply, add constant, etc.)" },
    ],
  },
  {
    topic: "Series & Patterns",
    subject: "LR",
    entries: [
      { label: "Arithmetic series", note: "Constant difference: 3, 7, 11, 15 … (d=4)" },
      { label: "Geometric series", note: "Constant ratio: 3, 6, 12, 24 … (r=2)" },
      { label: "Fibonacci-type", note: "Each term = sum of previous two: 1, 1, 2, 3, 5, 8, 13 …" },
      { label: "Difference series", note: "If no pattern, take differences; if still none, take 2nd differences" },
      { label: "Alternating series", note: "Odd and even positions follow separate sequences — analyse each separately" },
      { label: "Square/cube/prime series", note: "n², n³, or prime numbers — identify if terms grow rapidly" },
    ],
  },
  {
    topic: "Puzzles",
    subject: "LR",
    entries: [
      { label: "Tabulation method", note: "Draw a grid with all entities × all attributes; fill definite values first" },
      { label: "Elimination first", note: "Cross out impossible combinations before assigning possible ones" },
      { label: "Conditional logic", note: "'If A is in position 1, B must be in position 3' — use to derive chains" },
      { label: "Single-possibility rule", note: "If only one value remains in a cell after elimination, assign it" },
      { label: "Consistency check", note: "After placing all values, verify every given clue holds" },
    ],
  },
  {
    topic: "Directions & Distances",
    subject: "LR",
    entries: [
      { label: "Eight directions", note: "N, NE, E, SE, S, SW, W, NW — NE is between N and E, etc." },
      { label: "Right turns", note: "N→E→S→W→N (clockwise)" },
      { label: "Left turns", note: "N→W→S→E→N (anti-clockwise)" },
      { label: "Shortest distance", formula: "Use Pythagorean theorem on the net displacement: d = √(h²+v²)" },
      { label: "Shadow rule", note: "Morning (sunrise in east): shadow falls west. Evening (sunset in west): shadow falls east" },
    ],
  },
  {
    topic: "Clocks & Calendars",
    subject: "LR",
    entries: [
      { label: "Clock angle formula", formula: "θ = |30H − 5.5M|  (H = hour, M = minutes)" },
      { label: "Hands coincide", note: "Every 65 5/11 minutes; 22 times in 24 hours (not 24 times)" },
      { label: "Hands perpendicular", note: "22 times between 12–12 (44 times in 24 hours)" },
      { label: "Odd days — year", note: "Ordinary year = 1 odd day; Leap year = 2 odd days" },
      { label: "Leap year rule", note: "Divisible by 4 → leap; but century years must be divisible by 400 (2000=leap, 1900=not)" },
      { label: "Day codes", note: "0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat" },
    ],
  },
  {
    topic: "Statement Reasoning",
    subject: "LR",
    entries: [
      { label: "Assumption", note: "An unstated premise that MUST be true for the argument to hold; cannot be extreme" },
      { label: "Inference", note: "Must follow DIRECTLY from the given data — not a general truth, not an opinion" },
      { label: "Conclusion", note: "Logically certain follow-on; stronger than inference (must be true, not just likely)" },
      { label: "Strengthens argument", note: "Provides additional evidence or closes a gap in the stated argument" },
      { label: "Weakens argument", note: "Presents a counter-example or challenges the central assumption" },
      { label: "Course of action", note: "Must be practical, directly address the problem, and not exceed the stated scope" },
    ],
  },
  {
    topic: "Venn Diagrams",
    subject: "LR",
    entries: [
      { label: "Two sets union", formula: "n(A∪B) = n(A) + n(B) − n(A∩B)" },
      { label: "Three sets union", formula: "n(A∪B∪C) = n(A)+n(B)+n(C) − n(A∩B) − n(B∩C) − n(A∩C) + n(A∩B∩C)" },
      { label: "Only A", formula: "Only A = n(A) − n(A∩B) − n(A∩C) + n(A∩B∩C)" },
      { label: "None of the sets", formula: "None = Total − n(A∪B∪C)" },
      { label: "Exactly two sets", formula: "= n(A∩B) + n(B∩C) + n(A∩C) − 3×n(A∩B∩C)" },
    ],
  },
];

/** Quick lookup: topicName → FormulaEntry[] */
export const FORMULAS_BY_TOPIC: Record<string, FormulaEntry[]> = {};
for (const sheet of FORMULA_SHEETS) {
  FORMULAS_BY_TOPIC[sheet.topic] = sheet.entries;
}
