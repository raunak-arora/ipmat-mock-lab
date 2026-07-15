export interface FormulaEntry {
  label: string;
  formula?: string;
  note?: string;
}

export interface TopicSheet {
  topic: string;
  subject: "QUANT" | "VERBAL" | "LR" | "CAT_QA" | "CAT_VARC" | "CAT_DILR";
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

  /* ── CAT_QA ── */
  {
    topic: "Number System (CAT)",
    subject: "CAT_QA",
    entries: [
      { label: "Remainder theorems", note: "Fermat: aᵖ⁻¹ ≡ 1 (mod p) for prime p, gcd(a,p)=1. Wilson: (p−1)! ≡ −1 (mod p)" },
      { label: "Cyclicity of remainders", note: "Find pattern of aⁿ mod m — cycle length divides φ(m). Powers of 2 mod 10: cycle 4 (2,4,8,6)" },
      { label: "Last non-zero digit of n!", note: "Use the recurrence: last non-zero digit of 5k! differs by a known factor from (k−1)!" },
      { label: "Number of trailing zeros", formula: "zeros in n! = ⌊n/5⌋ + ⌊n/25⌋ + ⌊n/125⌋ + …" },
      { label: "Euler's totient φ(n)", formula: "φ(n) = n × ∏(1 − 1/p) for each prime p dividing n" },
      { label: "Sum of all factors", formula: "If n = aᵖbq…, sum = ((aᵖ⁺¹−1)/(a−1)) × ((b^(q+1)−1)/(b−1)) × …" },
      { label: "Base conversion tip", note: "To convert to base b: divide repeatedly by b, remainders (bottom-to-top) give the number" },
      { label: "LCM of fractions", formula: "LCM(a/b, c/d) = LCM(a,c) / HCF(b,d)" },
      { label: "HCF of fractions", formula: "HCF(a/b, c/d) = HCF(a,c) / LCM(b,d)" },
    ],
  },
  {
    topic: "Algebra (CAT)",
    subject: "CAT_QA",
    entries: [
      { label: "Modulus function", note: "|x| = x if x≥0, −x if x<0. |x−a| = distance from a on number line" },
      { label: "Greatest integer [x]", note: "[x] = floor of x. [3.7]=3, [−1.2]=−2. {x} = x − [x] (fractional part)" },
      { label: "Max/min of quadratic", formula: "ax²+bx+c: vertex at x=−b/2a. Max (a<0) or min (a>0) = c − b²/4a" },
      { label: "AM–GM applied", note: "For a+b = const, ab is maximised when a=b. For ab = const, a+b is minimised when a=b" },
      { label: "Cauchy-Schwarz (basic)", formula: "(a₁b₁+a₂b₂)² ≤ (a₁²+a₂²)(b₁²+b₂²)" },
      { label: "Polynomial remainder", note: "Remainder when p(x) divided by (x−a) = p(a) [Remainder theorem]" },
      { label: "Inequalities — flip rule", note: "Multiplying/dividing both sides by a negative flips the inequality sign" },
      { label: "Sign chart method", note: "For (x−a)(x−b)>0: test intervals (−∞,a), (a,b), (b,∞) separately" },
    ],
  },
  {
    topic: "Arithmetic (CAT)",
    subject: "CAT_QA",
    entries: [
      { label: "Weighted averages", formula: "If group A (size nₐ, avg ā) and B (nᵦ, b̄): combined avg = (nₐā + nᵦb̄)/(nₐ+nᵦ)" },
      { label: "Mixture removal rule", formula: "After k removals of volume v from vessel of volume V: purity = (1 − v/V)^k" },
      { label: "Boats & streams", formula: "Downstream = u+v, Upstream = u−v (u=boat speed, v=stream speed)" },
      { label: "Pipes — net rate", formula: "Fill rates add; empty rates subtract. Time = 1 / net rate" },
      { label: "Train crossing", formula: "Time = (L_train + L_object) / relative speed" },
      { label: "Partnership profits", note: "Profit split = ratio of (capital × time). Equal time → split by capital alone" },
      { label: "Population growth/decay", formula: "Final = Initial × (1 ± r/100)ⁿ" },
      { label: "Clocks — meeting time", formula: "Minute hand gains 5.5° per minute on hour hand. They meet every 720/11 ≈ 65.45 min" },
    ],
  },
  {
    topic: "Geometry & Mensuration (CAT)",
    subject: "CAT_QA",
    entries: [
      { label: "Centres of a triangle", note: "Centroid (medians, 2:1 ratio) · Circumcentre (⊥ bisectors) · Incentre (angle bisectors) · Orthocentre (altitudes)" },
      { label: "Angle bisector length", formula: "t_a = (2bc cos(A/2)) / (b+c)  where A is angle at vertex a" },
      { label: "Median length", formula: "m_a = ½√(2b²+2c²−a²)" },
      { label: "Area via inradius", formula: "Area = r × s  where r=inradius, s=semi-perimeter" },
      { label: "Circumradius", formula: "R = abc / (4 × Area)" },
      { label: "Similar triangles", note: "Ratio of areas = square of ratio of sides. Ratio of perimeters = ratio of sides" },
      { label: "Tangent-chord angle", formula: "Angle = ½ × intercepted arc" },
      { label: "Power of a point", formula: "PA × PB = PC × PD  (two chords / secants through P)" },
      { label: "Frustum volume", formula: "V = (πh/3)(R²+r²+Rr)  where R,r = radii of two bases" },
    ],
  },
  {
    topic: "Coordinate Geometry (CAT)",
    subject: "CAT_QA",
    entries: [
      { label: "Section formula", formula: "Point dividing P₁P₂ in m:n = ((mx₂+nx₁)/(m+n), (my₂+ny₁)/(m+n))" },
      { label: "Distance from a line", formula: "d = |ax₁+by₁+c| / √(a²+b²)  for point (x₁,y₁) from line ax+by+c=0" },
      { label: "Reflection of point", note: "Reflect (a,b) over y=x → (b,a). Over x-axis → (a,−b). Over y-axis → (−a,b)" },
      { label: "Angle between lines", formula: "tan θ = |(m₁−m₂)/(1+m₁m₂)|" },
      { label: "Perpendicular from a point", note: "Foot of perpendicular from (h,k) to ax+by+c=0: use section formula with ratio a²:b²" },
      { label: "Circle standard form", formula: "(x−h)²+(y−k)²=r²  centre (h,k), radius r" },
      { label: "Tangent to circle", formula: "From external point (x₁,y₁): length = √(x₁²+y₁²+Dx₁+Ey₁+F)" },
    ],
  },
  {
    topic: "Trigonometry (CAT)",
    subject: "CAT_QA",
    entries: [
      { label: "Compound angles", formula: "sin(A±B) = sinA cosB ± cosA sinB  |  cos(A±B) = cosA cosB ∓ sinA sinB" },
      { label: "Double angle", formula: "sin2A = 2sinA cosA  |  cos2A = cos²A−sin²A = 1−2sin²A = 2cos²A−1" },
      { label: "Product-to-sum", formula: "2sinA cosB = sin(A+B)+sin(A−B)  |  2cosA cosB = cos(A−B)+cos(A+B)" },
      { label: "Key values table", note: "sin0=0, sin30=½, sin45=1/√2, sin60=√3/2, sin90=1 · cos is reverse" },
      { label: "sinθ·sin(60°−θ)·sin(60°+θ)", formula: "= (1/4)sin3θ  [useful product identity]" },
      { label: "Graphs", note: "sinx: period 2π, range [−1,1] · tanx: period π, undefined at π/2+nπ" },
      { label: "Heights & distances", note: "Angle of elevation: look up from horizontal. Angle of depression: look down. Use tan for opposite/adjacent" },
    ],
  },
  {
    topic: "Functions & Progressions (CAT)",
    subject: "CAT_QA",
    entries: [
      { label: "AP sum — key trick", note: "Middle term = average. If n is odd, the median term equals the mean" },
      { label: "GP sum — ratio 1", formula: "If r=1: Sₙ = na" },
      { label: "AGP (Arith-Geo progression)", formula: "Sₙ has a closed form; for infinite AGP with |r|<1: S∞ = a/(1−r) + dr/(1−r)²" },
      { label: "Domain restrictions", note: "√f(x): need f(x)≥0 · 1/f(x): need f(x)≠0 · log f(x): need f(x)>0" },
      { label: "Composition f(g(x))", note: "Apply g first, then f. Domain: all x in domain(g) where g(x) is in domain(f)" },
      { label: "Inverse function", note: "f⁻¹ exists iff f is bijective (one-one and onto). Graph of f⁻¹ = reflection of f over y=x" },
      { label: "Summation identities", formula: "Σn = n(n+1)/2 · Σn² = n(n+1)(2n+1)/6 · Σn³ = [n(n+1)/2]²" },
    ],
  },
  {
    topic: "Logarithms & Surds (CAT)",
    subject: "CAT_QA",
    entries: [
      { label: "log base switching", formula: "log_a(b) = 1/log_b(a)" },
      { label: "Characteristic & mantissa", note: "log₁₀(x): characteristic = integer part (can be −ve), mantissa = decimal part (always ≥0)" },
      { label: "Number of digits", formula: "Digits in n = ⌊log₁₀ n⌋ + 1" },
      { label: "log inequalities", note: "If base>1: logₐx>logₐy ⟺ x>y. If 0<base<1: logₐx>logₐy ⟺ x<y (flips!)" },
      { label: "Common log values", note: "log2≈0.301 · log3≈0.477 · log7≈0.845 · ln2≈0.693" },
      { label: "Surd rationalization", formula: "1/(a+b√c) = (a−b√c)/(a²−b²c)" },
    ],
  },
  {
    topic: "Permutation & Combination (CAT)",
    subject: "CAT_QA",
    entries: [
      { label: "Derangements", formula: "D_n = n! × Σ(-1)^k/k! (k=0..n) ≈ n!/e for large n" },
      { label: "Stars & bars", formula: "Non-negative integer solutions to x₁+…+xₖ=n: C(n+k−1, k−1)" },
      { label: "Stars & bars (positive)", formula: "Positive integer solutions: C(n−1, k−1)" },
      { label: "Inclusion-exclusion", formula: "|A∪B∪C| = |A|+|B|+|C|−|A∩B|−|B∩C|−|A∩C|+|A∩B∩C|" },
      { label: "Multinomial", formula: "Arrangements of n things with repetitions p,q,r: n!/(p!q!r!)" },
      { label: "Identical objects in distinct boxes", formula: "No constraint: C(n+r−1,r−1) · Each box ≥1: C(n−1,r−1)" },
      { label: "Distinct objects in identical boxes", note: "Stirling numbers of the 2nd kind — complex; avoid unless specifically tested" },
    ],
  },
  {
    topic: "Probability (CAT)",
    subject: "CAT_QA",
    entries: [
      { label: "Bayes' theorem", formula: "P(A|B) = P(B|A)·P(A) / P(B)" },
      { label: "Total probability", formula: "P(B) = Σ P(B|Aᵢ)·P(Aᵢ) over mutually exclusive exhaustive events Aᵢ" },
      { label: "Binomial distribution", formula: "P(X=k) = C(n,k)·pᵏ·(1−p)^(n−k)" },
      { label: "Expected value", formula: "E(X) = Σ xᵢ·P(xᵢ)  |  E(aX+b) = aE(X)+b" },
      { label: "Geometric probability", note: "P = favourable length (or area) / total length (or area)" },
      { label: "Odds", note: "Odds in favour = P/(1−P). Odds against = (1−P)/P" },
    ],
  },
  {
    topic: "Modern Maths (CAT)",
    subject: "CAT_QA",
    entries: [
      { label: "Set identities", formula: "De Morgan: (A∪B)ᶜ = Aᶜ∩Bᶜ · (A∩B)ᶜ = Aᶜ∪Bᶜ" },
      { label: "Recurrence relations", note: "Write out first few terms, look for closed form: linear recurrences → characteristic equation" },
      { label: "Matrix determinant (2×2)", formula: "det[[a,b],[c,d]] = ad − bc" },
      { label: "Pigeonhole principle", note: "If n items in k boxes and n>k, at least one box has ≥⌈n/k⌉ items" },
    ],
  },

  /* ── CAT_VARC ── */
  {
    topic: "Reading Comprehension (CAT)",
    subject: "CAT_VARC",
    entries: [
      { label: "RC passage types", note: "Social sciences · Natural sciences · Humanities (philosophy, history, art) · Business/economics — each has a distinct tone" },
      { label: "Primary purpose question", note: "Answer must cover the WHOLE passage, not just one paragraph. Eliminate too-narrow or too-broad options" },
      { label: "Inference vs stated", note: "Inference = must be true based on the text (not assumed). Stated = directly in the passage. Don't mix them" },
      { label: "Author's tone", note: "Positive: appreciative, supportive, laudatory · Negative: critical, sceptical, dismissive · Neutral: objective, analytical, descriptive" },
      { label: "'Most appropriate title' trap", note: "Reject titles that cover only one paragraph or that add information not in the passage" },
      { label: "Elimination strategy", note: "Eliminate (a) factually wrong, (b) too extreme, (c) out of scope, (d) contradicts passage. What remains is the answer" },
      { label: "CAT RC passage length", note: "Typically 500–700 words, 4–6 questions per passage. 3 passages in VARC section" },
      { label: "Para-level summary", note: "After each paragraph, note: what was claimed? Is it supporting or refuting? Builds your mental map for questions" },
    ],
  },
  {
    topic: "Para Summary (CAT)",
    subject: "CAT_VARC",
    entries: [
      { label: "What it tests", note: "Choose the option that best captures the main idea of a 5–7 sentence paragraph. TITA — you type the answer letter (A/B/C/D)" },
      { label: "Correct summary must", note: "Cover the ENTIRE paragraph's scope · Be accurate (no information added or distorted) · Use appropriately hedged language" },
      { label: "Eliminate: too narrow", note: "An option focusing on a detail or example from the paragraph, not the central argument" },
      { label: "Eliminate: too broad", note: "An option making a universal claim not supported by the paragraph" },
      { label: "Eliminate: distortion", note: "Any option that changes 'may' to 'does', 'some' to 'all', or adds a causal claim not in the text" },
      { label: "Watch for extreme language", note: "Words like 'always', 'never', 'all', 'none', 'completely' are almost always wrong" },
      { label: "Strategy", note: "Read once, form your own summary in one line. Then pick the option closest to it. Don't re-read until needed" },
    ],
  },
  {
    topic: "Para Completion (CAT)",
    subject: "CAT_VARC",
    entries: [
      { label: "What it tests", note: "Find the sentence that most logically follows (or occasionally precedes) a given paragraph" },
      { label: "Match the tone", note: "If the paragraph is analytical, the completion must be analytical — not emotional or prescriptive" },
      { label: "No new topics", note: "The best completion extends or concludes the existing argument; it does not introduce unrelated ideas" },
      { label: "Direction clues", note: "Last sentence ending with 'however', 'but', 'yet' → completion presents a contrast. 'Therefore', 'thus' → completion draws a conclusion" },
      { label: "Pronoun consistency", note: "If the paragraph uses 'they' for a group, the completion should do the same — inconsistent pronoun reference signals a wrong option" },
      { label: "Tense consistency", note: "Keep the verb tense of the paragraph. Sudden switch to future tense often signals a wrong option" },
    ],
  },
  {
    topic: "Odd One Out (CAT)",
    subject: "CAT_VARC",
    entries: [
      { label: "What it tests", note: "Five sentences — four form a coherent paragraph, one doesn't belong. TITA: type the sentence number (1–5)" },
      { label: "Identify the theme first", note: "Read all five sentences and identify what 3–4 of them are clearly about before looking for the odd one" },
      { label: "Topic mismatch", note: "The odd sentence is often about a completely different subject introduced without connection" },
      { label: "Pronoun without antecedent", note: "If a sentence uses 'it' or 'they' but no prior sentence names the referent, it may be the odd one (or a paragraph opener)" },
      { label: "Transition mismatch", note: "The odd sentence often uses a logical connector ('however', 'therefore') that doesn't logically follow from any of the other sentences" },
      { label: "Time/scope jump", note: "A sentence that suddenly switches era (e.g., ancient history in a modern economics paragraph) is usually the odd one" },
      { label: "Verify by assembling", note: "After identifying the odd sentence, check that the remaining four actually form a coherent, connected paragraph" },
    ],
  },
  {
    topic: "Critical Reasoning (CAT)",
    subject: "CAT_VARC",
    entries: [
      { label: "Argument structure", note: "Premise(s) → Conclusion. Identify each before answering. The conclusion is what the author is trying to prove" },
      { label: "Assumption", note: "An unstated premise WITHOUT which the argument collapses. Test: negate it — if the argument breaks, it's an assumption" },
      { label: "Weaken", note: "Provide evidence that makes the conclusion less likely. Attack the link between premise and conclusion" },
      { label: "Strengthen", note: "Provide evidence that makes the conclusion more likely. Close a gap or rule out an alternative explanation" },
      { label: "Flaw types", note: "Correlation ≠ causation · Hasty generalisation · False dichotomy · Ad hominem · Slippery slope · Affirming the consequent" },
      { label: "Evaluate", note: "Identify which piece of information, if known, would most help assess the argument's validity" },
      { label: "Boldface questions", note: "Identify the role of highlighted portions: is it a premise, a conclusion, a counter-argument, or a background fact?" },
    ],
  },

  /* ── CAT_DILR ── */
  {
    topic: "Data Interpretation (CAT)",
    subject: "CAT_DILR",
    entries: [
      { label: "Percentage calculation shortcut", note: "10% = move decimal one left. 5% = half of 10%. 15% = 10%+5%. Build any % from these anchors" },
      { label: "Percentage point vs percentage", note: "If X goes from 20% to 25%, it's a 5 percentage-point rise but a 25% relative increase" },
      { label: "CAGR formula", formula: "CAGR = (End/Start)^(1/n) − 1  where n = number of years" },
      { label: "Index number", formula: "Index = (Value / Base value) × 100. Change in index ≠ change in original value" },
      { label: "Approximation strategy", note: "In CAT DI, exact calculation is rare. Round aggressively and check answer proximity. Most options are well-separated" },
      { label: "Table reading", note: "Note column headers and units before computing. Row sum vs column sum confusion is the #1 error" },
    ],
  },
  {
    topic: "Logical Reasoning (CAT)",
    subject: "CAT_DILR",
    entries: [
      { label: "Set-up: draw the grid", note: "For scheduling/seating/assignment puzzles, draw a grid (entities × attributes) before reading clues" },
      { label: "Definite vs conditional clues", note: "Apply definite clues (always true) first. Hold conditional clues ('if A then B') and apply when one branch is fixed" },
      { label: "Seating — circular vs linear", note: "Circular: fix one person, arrange rest. Opposite in circular = n/2 seats away" },
      { label: "Blood relations tree", note: "Always draw a family tree. Assign gender as you go. Resolve one link at a time" },
      { label: "Binary Logic (T/L puzzles)", note: "Assume one person's type (T or L), derive all others from statements, check for contradiction. Two tries max" },
      { label: "Tournament brackets", note: "Knockout: n−1 matches to find winner. Round-robin: C(n,2) matches total" },
      { label: "Scheduling constraints", note: "List dependencies first (A before B). Then place fixed-time items. Fill gaps with flex items" },
      { label: "Caselet approach", note: "Read all questions before solving — later questions sometimes give data that disambiguates earlier ones" },
    ],
  },
  {
    topic: "Venn Diagrams & Sets (CAT)",
    subject: "CAT_DILR",
    entries: [
      { label: "Two-set formula", formula: "n(A∪B) = n(A)+n(B)−n(A∩B)" },
      { label: "Three-set formula", formula: "n(A∪B∪C) = n(A)+n(B)+n(C)−n(A∩B)−n(B∩C)−n(A∩C)+n(A∩B∩C)" },
      { label: "Only A", formula: "Only A = n(A)−n(A∩B)−n(A∩C)+n(A∩B∩C)" },
      { label: "Exactly two", formula: "= n(A∩B)+n(B∩C)+n(A∩C) − 3n(A∩B∩C)" },
      { label: "At least two", formula: "= n(A∩B)+n(B∩C)+n(A∩C) − 2n(A∩B∩C)" },
      { label: "None", formula: "= Total − n(A∪B∪C)" },
    ],
  },
  {
    topic: "Networks & Routes (CAT)",
    subject: "CAT_DILR",
    entries: [
      { label: "Shortest path intuition", note: "For small graphs, enumerate 2–3 plausible paths; pick the shortest. Dijkstra's algorithm is overkill for CAT" },
      { label: "Counting paths", note: "On a grid from (0,0) to (m,n) moving only right/up: C(m+n, m) paths" },
      { label: "Flow problems", note: "Max flow = min cut (max-flow min-cut theorem). Identify the bottleneck edges" },
      { label: "Traversal rules", note: "Euler path exists iff exactly 0 or 2 vertices have odd degree. Euler circuit: all vertices have even degree" },
    ],
  },
  {
    topic: "Games & Tournaments (CAT)",
    subject: "CAT_DILR",
    entries: [
      { label: "Round-robin total matches", formula: "C(n,2) = n(n−1)/2  for n teams" },
      { label: "Total points in round-robin", note: "Each match distributes exactly 2 points (win+loss) or 2 points (draw+draw). Total = 2×C(n,2) = n(n−1)" },
      { label: "Knockout total matches", formula: "n−1 matches to determine winner from n teams" },
      { label: "Points table reconstruction", note: "Use row sums and column constraints. Consistent assignment: each row sum = each team's total points" },
      { label: "Seeding & upsets", note: "In seeded knockouts, work backward from final to first round. Label bracket positions, not teams" },
    ],
  },
];

/** Quick lookup: topicName → FormulaEntry[] */
export const FORMULAS_BY_TOPIC: Record<string, FormulaEntry[]> = {};
for (const sheet of FORMULA_SHEETS) {
  FORMULAS_BY_TOPIC[sheet.topic] = sheet.entries;
}

/** CAT question topics whose sheet lives under a differently-named CAT sheet. */
const CAT_TOPIC_ALIASES: Record<string, string> = {
  "Data Tables": "Data Interpretation (CAT)",
  "Bar Graphs": "Data Interpretation (CAT)",
  "Line Graphs": "Data Interpretation (CAT)",
  "Pie Charts": "Data Interpretation (CAT)",
  "Caselets": "Data Interpretation (CAT)",
  "Seating Arrangements": "Logical Reasoning (CAT)",
  "Grid & Matrix Puzzles": "Logical Reasoning (CAT)",
  "Scheduling & Sequencing": "Logical Reasoning (CAT)",
  "Binary Logic": "Logical Reasoning (CAT)",
  "Venn Diagrams": "Venn Diagrams & Sets (CAT)",
  "Routes & Networks": "Networks & Routes (CAT)",
  "Permutation and Combination": "Permutation & Combination (CAT)",
};

/**
 * Exam-aware formula lookup. CAT sheets are suffixed "(CAT)", so a CAT
 * attempt's weak topic "Number System" must resolve to "Number System (CAT)",
 * not the IPMAT sheet — and DILR topics map onto shared CAT sheets.
 */
export function formulasForTopic(topic: string, family: "IPMAT" | "CAT"): FormulaEntry[] | undefined {
  if (family === "CAT") {
    return (
      FORMULAS_BY_TOPIC[`${topic} (CAT)`] ??
      FORMULAS_BY_TOPIC[CAT_TOPIC_ALIASES[topic]] ??
      FORMULAS_BY_TOPIC[topic]
    );
  }
  return FORMULAS_BY_TOPIC[topic];
}
