/**
 * THE FORBIDDEN REALM: THE TRIALS OF KNOWLEDGE
 * Differential Calculus Question & Puzzle Engine
 * Verified mathematical problems, detailed explanations, and presentation codex.
 */

class CalculusManager {
  constructor() {
    this.totalQuestionsAnswered = 0;
    this.totalQuestionsCorrect = 0;

    // Verified Question Banks categorized by Realm and Difficulty
    this.questionBank = {
      // REALM 1: LIMITS & CONTINUITY
      realm1: [
        {
          id: 'r1_q1',
          type: 'mcq',
          phase: 1,
          topic: 'Limits by Direct Substitution',
          lore: 'Morgathia weaves a curse of broken thresholds. Evaluate the approaching boundary!',
          equation: '\\lim_{x \\to 3} (2x^2 - 4x + 5)',
          displayEquation: 'lim (x → 3) [ 2x² - 4x + 5 ]',
          options: [
            { text: '11', isCorrect: true },
            { text: '17', isCorrect: false },
            { text: '9', isCorrect: false },
            { text: '14', isCorrect: false }
          ],
          explanation: 'Since polynomial functions are continuous everywhere, evaluate the limit by direct substitution:\nlim (x → 3) = 2(3)² - 4(3) + 5 = 2(9) - 12 + 5 = 18 - 12 + 5 = 11.',
          damage: 35
        },
        {
          id: 'r1_q2',
          type: 'mcq',
          phase: 1,
          topic: 'Limits with Factoring (0/0 Indeterminate Form)',
          lore: 'The witch casts an indeterminate hex of 0/0. Factor the spell to break its hold!',
          equation: '\\lim_{x \\to 4} \\frac{x^2 - 16}{x - 4}',
          displayEquation: 'lim (x → 4) [ (x² - 16) / (x - 4) ]',
          options: [
            { text: '8', isCorrect: true },
            { text: '4', isCorrect: false },
            { text: '0', isCorrect: false },
            { text: 'Does Not Exist', isCorrect: false }
          ],
          explanation: 'Direct substitution yields 0/0 (indeterminate form).\nFactor the numerator difference of squares: (x² - 16) = (x - 4)(x + 4).\nCancel common factor (x - 4):\nlim (x → 4) (x + 4) = 4 + 4 = 8.',
          damage: 35
        },
        {
          id: 'r1_q3',
          type: 'numeric',
          phase: 1,
          topic: 'One-Sided Limits & Factoring',
          lore: 'A phantom barrier blocks the gate. Enter the exact integer limit value!',
          equation: '\\lim_{x \\to -2} \\frac{x^2 + 5x + 6}{x + 2}',
          displayEquation: 'lim (x → -2) [ (x² + 5x + 6) / (x + 2) ]',
          correctAnswer: '1',
          acceptableAnswers: ['1', '1.0'],
          explanation: 'Direct substitution gives 0/0. Factor numerator: (x + 2)(x + 3).\nCancel (x + 2):\nlim (x → -2) (x + 3) = -2 + 3 = 1.',
          damage: 40
        },
        {
          id: 'r1_q4',
          type: 'mcq',
          phase: 2,
          topic: 'Removable Discontinuity & Conjugate Rationalization',
          lore: 'Morgathia summons a radical curse! Rationalize the expression to expose the truth.',
          equation: '\\lim_{x \\to 0} \\frac{\\sqrt{x + 9} - 3}{x}',
          displayEquation: 'lim (x → 0) [ (√(x + 9) - 3) / x ]',
          options: [
            { text: '1/6', isCorrect: true },
            { text: '1/3', isCorrect: false },
            { text: '0', isCorrect: false },
            { text: '1/9', isCorrect: false }
          ],
          explanation: 'Multiply numerator and denominator by conjugate (√(x + 9) + 3):\n[(x + 9) - 9] / [x(√(x + 9) + 3)] = x / [x(√(x + 9) + 3)] = 1 / (√(x + 9) + 3).\nAs x → 0, 1 / (√9 + 3) = 1 / (3 + 3) = 1/6.',
          damage: 40
        },
        {
          id: 'r1_q5',
          type: 'mcq',
          phase: 2,
          topic: 'Piecewise Continuity Parameter',
          lore: 'The bridge across the chasm is fractured! Find k so that f(x) is continuous at x = 2.',
          equation: 'f(x) = \\begin{cases} kx + 3, & x \\le 2 \\\\ x^2 + 1, & x > 2 \\end{cases}',
          displayEquation: 'f(x) = { kx + 3 (x ≤ 2), x² + 1 (x > 2) }. Find k for continuity at x = 2.',
          options: [
            { text: 'k = 1', isCorrect: true },
            { text: 'k = 2', isCorrect: false },
            { text: 'k = -1', isCorrect: false },
            { text: 'k = 4', isCorrect: false }
          ],
          explanation: 'For continuity at x = 2, left-hand limit must equal right-hand limit:\nlim (x → 2⁻) (kx + 3) = 2k + 3\nlim (x → 2⁺) (x² + 1) = 2² + 1 = 5\nEquate: 2k + 3 = 5  ⟹  2k = 2  ⟹  k = 1.',
          damage: 45
        },
        {
          id: 'r1_q6',
          type: 'mcq',
          phase: 3,
          topic: 'Limits at Infinity (Horizontal Asymptote)',
          lore: 'The Witch conjures infinite cosmic chaos. Find the horizontal asymptote!',
          equation: '\\lim_{x \\to \\infty} \\frac{6x^2 + 7x - 2}{2x^2 - 5x + 3}',
          displayEquation: 'lim (x → ∞) [ (6x² + 7x - 2) / (2x² - 5x + 3) ]',
          options: [
            { text: '3', isCorrect: true },
            { text: '∞', isCorrect: false },
            { text: '0', isCorrect: false },
            { text: '6', isCorrect: false }
          ],
          explanation: 'Divide both numerator and denominator by highest power x²:\nlim (x → ∞) [ 6 + 7/x - 2/x² ] / [ 2 - 5/x + 3/x² ].\nTerms with 1/x vanish to 0, leaving 6 / 2 = 3.',
          damage: 50
        },
        {
          id: 'r1_q7',
          type: 'numeric',
          phase: 3,
          topic: 'Special Trigonometric Limit',
          lore: 'Morgathia channels the fundamental trigonometric limit! Enter the numerical result.',
          equation: '\\lim_{x \\to 0} \\frac{\\sin(5x)}{x}',
          displayEquation: 'lim (x → 0) [ sin(5x) / x ]',
          correctAnswer: '5',
          acceptableAnswers: ['5', '5.0'],
          explanation: 'Using the fundamental theorem lim (θ → 0) [sin(θ)/θ] = 1:\nlim (x → 0) [sin(5x) / x] = 5 · lim (5x → 0) [sin(5x) / (5x)] = 5 · (1) = 5.',
          damage: 50
        }
      ],

      // REALM 2: BASIC TRIGONOMETRIC DERIVATIVES
      realm2: [
        {
          id: 'r2_q1',
          type: 'mcq',
          phase: 1,
          topic: 'Fundamental Sine Derivative',
          lore: 'A Skeleton Scholar challenges you with the primary law of trigonometric motion!',
          equation: '\\frac{d}{dx}[\\sin(x)]',
          displayEquation: 'd/dx [ sin(x) ] = ?',
          options: [
            { text: 'cos(x)', isCorrect: true },
            { text: '-cos(x)', isCorrect: false },
            { text: '-sin(x)', isCorrect: false },
            { text: 'sec²(x)', isCorrect: false }
          ],
          explanation: 'The fundamental derivative of sin(x) with respect to x is cos(x).\nProof via limit definition: lim (h → 0) [sin(x+h) - sin(x)] / h = cos(x).',
          damage: 35
        },
        {
          id: 'r2_q2',
          type: 'mcq',
          phase: 1,
          topic: 'Fundamental Cosine Derivative',
          lore: 'The Undead Guardian raises its shield. What is the rate of change of cosine?',
          equation: '\\frac{d}{dx}[\\cos(x)]',
          displayEquation: 'd/dx [ cos(x) ] = ?',
          options: [
            { text: '-sin(x)', isCorrect: true },
            { text: 'sin(x)', isCorrect: false },
            { text: '-cos(x)', isCorrect: false },
            { text: '-csc²(x)', isCorrect: false }
          ],
          explanation: 'The derivative of cos(x) is -sin(x). Remember that derivatives of co-functions (cos, cot, csc) always carry a negative sign!',
          damage: 35
        },
        {
          id: 'r2_q3',
          type: 'mcq',
          phase: 2,
          topic: 'Derivative of Tangent and Secant',
          lore: 'Vorthak summons spectral tangent flames. Differentiate tan(x)!',
          equation: '\\frac{d}{dx}[\\tan(x)]',
          displayEquation: 'd/dx [ tan(x) ] = ?',
          options: [
            { text: 'sec²(x)', isCorrect: true },
            { text: 'cot²(x)', isCorrect: false },
            { text: 'sec(x)tan(x)', isCorrect: false },
            { text: '-csc²(x)', isCorrect: false }
          ],
          explanation: 'Since tan(x) = sin(x)/cos(x), apply quotient rule:\n[cos(x)·cos(x) - sin(x)·(-sin(x))] / cos²(x) = (cos²(x) + sin²(x)) / cos²(x) = 1 / cos²(x) = sec²(x).',
          damage: 40
        },
        {
          id: 'r2_q4',
          type: 'mcq',
          phase: 2,
          topic: 'Derivative of Secant & Cosecant',
          lore: 'Phantom Mages cast a curse of secants! What is d/dx [sec(x)]?',
          equation: '\\frac{d}{dx}[\\sec(x)]',
          displayEquation: 'd/dx [ sec(x) ] = ?',
          options: [
            { text: 'sec(x)tan(x)', isCorrect: true },
            { text: 'tan²(x)', isCorrect: false },
            { text: '-sec(x)tan(x)', isCorrect: false },
            { text: '-csc(x)cot(x)', isCorrect: false }
          ],
          explanation: 'sec(x) = 1/cos(x) = (cos(x))⁻¹.\nBy chain rule: -1(cos(x))⁻² · (-sin(x)) = sin(x) / cos²(x) = (1/cos(x)) · (sin(x)/cos(x)) = sec(x)tan(x).',
          damage: 40
        },
        {
          id: 'r2_q5',
          type: 'mcq',
          phase: 3,
          topic: 'Trigonometric Chain Rule',
          lore: 'The Lich King channels necrotic chain energy into an inner function!',
          equation: '\\frac{d}{dx}[\\sin(4x)]',
          displayEquation: 'd/dx [ sin(4x) ] = ?',
          options: [
            { text: '4 cos(4x)', isCorrect: true },
            { text: 'cos(4x)', isCorrect: false },
            { text: '-4 cos(4x)', isCorrect: false },
            { text: '4 sin(4x)', isCorrect: false }
          ],
          explanation: 'By the Chain Rule: d/dx [f(g(x))] = f\'(g(x)) · g\'(x).\nHere f(u) = sin(u), u = 4x, so u\' = 4.\nTherefore: cos(4x) · 4 = 4 cos(4x).',
          damage: 45
        },
        {
          id: 'r2_q6',
          type: 'mcq',
          phase: 3,
          topic: 'Product Rule with Trigonometry',
          lore: 'Vorthak strikes with a composite sword of algebra and trigonometry!',
          equation: '\\frac{d}{dx}[x^2 \\sin(x)]',
          displayEquation: 'd/dx [ x² · sin(x) ] = ?',
          options: [
            { text: '2x sin(x) + x² cos(x)', isCorrect: true },
            { text: '2x cos(x)', isCorrect: false },
            { text: 'x² cos(x) - 2x sin(x)', isCorrect: false },
            { text: '2x sin(x)', isCorrect: false }
          ],
          explanation: 'Apply Product Rule (u·v)\' = u\'v + uv\':\nLet u = x² (u\' = 2x) and v = sin(x) (v\' = cos(x)).\nResult: 2x sin(x) + x² cos(x).',
          damage: 50
        },
        {
          id: 'r2_q7',
          type: 'numeric',
          phase: 4,
          topic: 'Slope of Tangent Line to Trigonometric Curve',
          lore: 'Death\'s Equation manifests! Find the slope of the tangent line to y = 3 sin(x) at x = 0.',
          equation: 'm = \\left. \\frac{d}{dx}[3\\sin(x)] \\right|_{x=0}',
          displayEquation: 'Find slope of y = 3 sin(x) at x = 0. Enter integer m.',
          correctAnswer: '3',
          acceptableAnswers: ['3', '3.0'],
          explanation: 'The derivative dy/dx = 3 cos(x).\nAt x = 0: m = 3 cos(0) = 3(1) = 3. The instantaneous rate of change is 3!',
          damage: 55
        }
      ],

      // REALM 3: THE FINAL CALCULUS TRIAL (AZRAEL, THE ETERNAL EQUATION)
      realm3: [
        {
          id: 'r3_q1',
          type: 'mcq',
          phase: 1,
          topic: 'Higher-Order Trigonometric Derivative',
          lore: 'Azrael harnesses the second derivative of the cosmic wave function!',
          equation: '\\frac{d^2}{dx^2}[\\cos(2x)]',
          displayEquation: 'd²/dx² [ cos(2x) ] = ?',
          options: [
            { text: '-4 cos(2x)', isCorrect: true },
            { text: '-2 sin(2x)', isCorrect: false },
            { text: '4 cos(2x)', isCorrect: false },
            { text: '-4 sin(2x)', isCorrect: false }
          ],
          explanation: 'First derivative: d/dx [cos(2x)] = -2 sin(2x).\nSecond derivative: d/dx [-2 sin(2x)] = -2 · 2 cos(2x) = -4 cos(2x).',
          damage: 50
        },
        {
          id: 'r3_q2',
          type: 'mcq',
          phase: 2,
          topic: 'Critical Points & Extreme Values',
          lore: 'Azrael creates a gravitational vortex at the critical point of f(x) = x³ - 3x. Where is the local maximum?',
          equation: 'f\'(x) = 3x^2 - 3 = 0',
          displayEquation: 'Find the x-coordinate of the local maximum for f(x) = x³ - 3x.',
          options: [
            { text: 'x = -1', isCorrect: true },
            { text: 'x = 1', isCorrect: false },
            { text: 'x = 0', isCorrect: false },
            { text: 'x = 3', isCorrect: false }
          ],
          explanation: 'f\'(x) = 3x² - 3 = 0  ⟹  x² = 1  ⟹  x = ±1.\nSecond derivative test: f\'\'(x) = 6x.\nf\'\'(-1) = -6 < 0 (concave down ⟹ local maximum at x = -1).\nf\'\'(1) = 6 > 0 (local minimum at x = 1).',
          damage: 55
        },
        {
          id: 'r3_q3',
          type: 'mcq',
          phase: 3,
          topic: 'Instantaneous Rate of Change / Physics Application',
          lore: 'A magical projectile travels along s(t) = 4t² - 2t + 10. What is its velocity v(t) at t = 3 seconds?',
          equation: 'v(t) = s\'(t) = 8t - 2 \\implies v(3)',
          displayEquation: 's(t) = 4t² - 2t + 10. Find velocity v(3).',
          options: [
            { text: '22', isCorrect: true },
            { text: '24', isCorrect: false },
            { text: '20', isCorrect: false },
            { text: '40', isCorrect: false }
          ],
          explanation: 'Velocity is the instantaneous rate of change of position:\nv(t) = ds/dt = 8t - 2.\nAt t = 3: v(3) = 8(3) - 2 = 24 - 2 = 22 units/s.',
          damage: 55
        },
        {
          id: 'r3_q4',
          type: 'numeric',
          phase: 4,
          topic: 'The Ultimate Calculus Synthesis',
          lore: 'Azrael unleashes the Forbidden Equation! Solve the limit of the derivative quotient!',
          equation: '\\lim_{x \\to 0} \\frac{1 - \\cos(x)}{x^2}',
          displayEquation: 'Evaluate: lim (x → 0) [ (1 - cos(x)) / x² ]. Enter as decimal (e.g. 0.5)',
          correctAnswer: '0.5',
          acceptableAnswers: ['0.5', '1/2', '.5'],
          explanation: 'Multiplying by conjugate (1 + cos(x)):\n[ (1 - cos²(x)) ] / [ x²(1 + cos(x)) ] = [ sin²(x) / x² ] · [ 1 / (1 + cos(x)) ].\nlim (x → 0) [sin(x)/x]² = 1² = 1, and 1 / (1 + cos(0)) = 1 / 2 = 0.5!\n(Alternatively via L\'Hôpital\'s Rule: sin(x)/(2x) → cos(x)/2 = 1/2 = 0.5).',
          damage: 65
        }
      ]
    };

    // BATANGAS STATE UNIVERSITY SEMESTRAL PROJECT WORKED EXAMPLES
    this.workedExamples = [
      {
        title: 'Worked Example 1: Energy Bridge Stabilization via Limits',
        course: 'MATH 101 - Differential Calculus',
        concept: 'Limits and Continuity of Rational Functions',
        problemStatement: 'In Level 1 (The Witch\'s Cursed Forest), a collapsed magical stone bridge requires finding the limiting altitude as coordinate x approaches 3: lim (x → 3) [ (x² - 9) / (x - 3) ].',
        mathematicalSolution: [
          'Step 1: Test direct substitution x = 3:\n   (3² - 9) / (3 - 3) = 0/0 (Indeterminate Form)',
          'Step 2: Factor algebraic difference of squares in numerator:\n   x² - 9 = (x - 3)(x + 3)',
          'Step 3: Cancel common factor (x - 3) for x ≠ 3:\n   lim (x → 3) [ (x - 3)(x + 3) / (x - 3) ] = lim (x → 3) (x + 3)',
          'Step 4: Substitute x = 3:\n   3 + 3 = 6 units height.'
        ],
        gameplayEffect: 'The player inputs the limiting value 6, locking the bridge segments into continuous alignment, enabling crossing over the chasm and dealing 35 damage to Morgathia\'s barrier!'
      },
      {
        title: 'Worked Example 2: Breaking the Lich\'s Spectral Shield with Trig Derivatives',
        course: 'MATH 101 - Differential Calculus',
        concept: 'Derivative of Trigonometric Composite Functions (Chain Rule)',
        problemStatement: 'In Level 2 (The Forgotten Kingdom), Lich King Vorthak generates an oscillating necrotic barrier with energy curve E(t) = 5 sin(3t). The player must calculate the instantaneous rate of change of energy at t = 0 to overload the ward.',
        mathematicalSolution: [
          'Step 1: Identify outer function f(u) = 5 sin(u) and inner function u = 3t.',
          'Step 2: Differentiate outer function: f\'(u) = 5 cos(u).',
          'Step 3: Differentiate inner function: du/dt = 3.',
          'Step 4: Apply Chain Rule: dE/dt = 5 cos(3t) · 3 = 15 cos(3t).',
          'Step 5: Evaluate at t = 0:\n   dE/dt = 15 cos(0) = 15(1) = 15 MegaWatts/sec.'
        ],
        gameplayEffect: 'Correctly determining 15 overloads Vorthak\'s spectral shield, shattering his invulnerability phase and granting the player an opening for melee and magic strikes!'
      },
      {
        title: 'Worked Example 3: Banishing the Forbidden Equation via Critical Rates of Change',
        course: 'MATH 101 - Differential Calculus',
        concept: 'Second-Order Derivatives & Harmonic Oscillations',
        problemStatement: 'In Level 3 (The Realm Beyond Infinity), Azrael casts an orbital wave equation Ψ(x) = 2 cos(4x). The player must compute the second derivative d²Ψ/dx² to resonate the Sacred Calculus Crystals at anti-phase.',
        mathematicalSolution: [
          'Step 1: First derivative using chain rule:\n   dΨ/dx = 2 · (-sin(4x)) · 4 = -8 sin(4x)',
          'Step 2: Second derivative using chain rule:\n   d²Ψ/dx² = -8 · (cos(4x)) · 4 = -32 cos(4x)',
          'Step 3: Interpretation: The second derivative is directly proportional to -16 times the original displacement Ψ(x), demonstrating Simple Harmonic Oscillation.'
        ],
        gameplayEffect: 'The anti-phase harmonic resonance shatters Azrael\'s dimensional tether, allowing the final blow that fuses all three Sacred Crystal Fragments to seal the Forbidden Equation forever!'
      }
    ];
  }

    this.lastQuestionId = null;
  }

  getQuestionsForRealm(realmId, phase = 1) {
    const key = `realm${realmId}`;
    const pool = this.questionBank[key] || this.questionBank.realm1;
    // Filter by phase or return random subset
    const filtered = pool.filter(q => q.phase === phase);
    return filtered.length > 0 ? filtered : pool;
  }

  getRandomQuestion(realmId, phase = 1) {
    const list = this.getQuestionsForRealm(realmId, phase);
    
    // Avoid duplicate question in same encounter if more than 1 available
    let available = list.filter(q => q.id !== this.lastQuestionId);
    if (available.length === 0) available = list;

    const randomIndex = Math.floor(Math.random() * available.length);
    const selected = available[randomIndex];
    this.lastQuestionId = selected.id;

    // Deep clone question
    const qClone = JSON.parse(JSON.stringify(selected));

    // Fisher-Yates Shuffle on Multiple Choice Options so correct answer is randomly A, B, C, or D
    if (qClone.type === 'mcq' && qClone.options && qClone.options.length > 1) {
      for (let i = qClone.options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = qClone.options[i];
        qClone.options[i] = qClone.options[j];
        qClone.options[j] = temp;
      }
    }

    return qClone;
  }

  recordAnswer(isCorrect) {
    this.totalQuestionsAnswered++;
    if (isCorrect) {
      this.totalQuestionsCorrect++;
    }
  }

  getAccuracy() {
    if (this.totalQuestionsAnswered === 0) return 100;
    return Math.round((this.totalQuestionsCorrect / this.totalQuestionsAnswered) * 100);
  }
}

window.calculusManager = new CalculusManager();

