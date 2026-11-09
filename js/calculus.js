/**
 * THE FORBIDDEN REALM: THE TRIALS OF KNOWLEDGE
 * Calculus Telemetry & Academic Codex Engine (MATH 101 differential calculus)
 *
 * Provides real-time evaluation of active in-world mechanics (Limits, Piecewise Continuity,
 * Asymptotes, IVT, and Trigonometric Derivatives) and worked step-by-step proofs.
 * Zero quiz popups — pure gameplay mathematics.
 */

class CalculusManager {
  constructor() {
    this.totalMechanicsTriggered = 0;
    this.totalSuccessSurges = 0;

    // BATANGAS STATE UNIVERSITY SEMESTRAL PROJECT WORKED EXAMPLES
    this.workedExamples = [
      {
        title: 'Worked Example 1: Rift Seal Discontinuity via Limits',
        course: 'MATH 101 - Differential Calculus',
        concept: 'Limits & Removable Discontinuities of Rational Functions',
        problemStatement: 'In Realm 1 (The Cursed Forest), a Corrupted Rift Seal barrier radiates power according to f(x) = (x² - 9)/(x - 3). Direct presence at the singularity x = 3 yields undefined behavior. The player tunes resonance frequency x to approach 3 from both sides.',
        mathematicalSolution: [
          'Step 1: Test direct substitution at boundary x = 3:\n   f(3) = (3² - 9) / (3 - 3) = 0/0 (Indeterminate Form; removable hole).',
          'Step 2: Factor algebraic difference of squares in numerator:\n   x² - 9 = (x - 3)(x + 3)',
          'Step 3: Cancel common factor (x - 3) for x ≠ 3:\n   lim (x → 3) [ (x - 3)(x + 3) / (x - 3) ] = lim (x → 3) (x + 3)',
          'Step 4: Compute two-sided limit:\n   Left:  x = 2.99  ⟹  f(x) = 5.99\n   Right: x = 3.01  ⟹  f(x) = 6.01\n   lim (x → 3⁻) f(x) = lim (x → 3⁺) f(x) = 3 + 3 = 6.00 units power.'
        ],
        gameplayEffect: 'Approaching frequency x → 3 channels exact resonance power of 6.00, shattering the Rift Seal to yield Forest Key I without touching the undefined singular hole at x = 3!'
      },
      {
        title: 'Worked Example 2: Piecewise Bridge Continuity & Parameter Tuning',
        course: 'MATH 101 - Differential Calculus',
        concept: 'Continuity of Piecewise Functions at Partition Boundaries',
        problemStatement: 'A fractured spectral stone bridge spanning a chasm is defined by f(x) = { kx + 3 for x ≤ 2; x² + 1 for x > 2 }. The player places a rune dial to tune parameter k so the bridge solidifies.',
        mathematicalSolution: [
          'Step 1: State criteria for continuity at partition point x = 2:\n   (1) f(2) exists\n   (2) lim (x → 2) f(x) exists ⟺ lim (x → 2⁻) f(x) = lim (x → 2⁺) f(x)\n   (3) lim (x → 2) f(x) = f(2).',
          'Step 2: Evaluate left-hand limit approaching 2:\n   lim (x → 2⁻) (kx + 3) = k(2) + 3 = 2k + 3.',
          'Step 3: Evaluate right-hand limit approaching 2:\n   lim (x → 2⁺) (x² + 1) = 2² + 1 = 4 + 1 = 5.',
          'Step 4: Equate one-sided limits to solve parameter k:\n   2k + 3 = 5  ⟹  2k = 2  ⟹  k = 1.00.'
        ],
        gameplayEffect: 'When rune parameter k = 1, Jump = |5 - 5| = 0. The piecewise function becomes continuous at x = 2, causing the flickering bridge to solidify into real stone across the chasm!'
      },
      {
        title: 'Worked Example 3: Harmonic Platform Oscillation & Critical Leap Velocity',
        course: 'MATH 101 - Differential Calculus',
        concept: 'First and Second Derivatives of Trigonometric Functions',
        problemStatement: 'A floating crystalline elevator in Realm 2 oscillates vertically along y(t) = 3.5 sin(1.2t). To leap without falling or taking kinetic shock, the player must identify when velocity v(t) = y\'(t) vanishes (reaches zero).',
        mathematicalSolution: [
          'Step 1: Position function:\n   y(t) = 3.5 sin(1.2t)',
          'Step 2: Apply derivative chain rule d/dt [sin(ωt)] = ω cos(ωt):\n   v(t) = y\'(t) = 3.5 · 1.2 · cos(1.2t) = 4.2 cos(1.2t) m/s',
          'Step 3: Acceleration (second derivative):\n   a(t) = v\'(t) = -4.2 · 1.2 · sin(1.2t) = -5.04 sin(1.2t) m/s²',
          'Step 4: Find critical stationary points where v(t) = 0:\n   4.2 cos(1.2t) = 0  ⟹  1.2t = π/2 + nπ  ⟹  t ≈ 1.31s, 3.93s, ...\n   At these points, y reaches peak amplitude ±3.5m and platform is momentarily motionless.'
        ],
        gameplayEffect: 'When v(t) ≈ 0, the platform illuminates radiant emerald green signaling the safe leap window. Attempting to board at max velocity |v| = 4.2 m/s causes slippage!'
      },
      {
        title: 'Worked Example 4: Asymptotic Singularity Danger Zone',
        course: 'MATH 101 - Differential Calculus',
        concept: 'Infinite Limits & Vertical Asymptotes',
        problemStatement: 'Dark Witch Morgathia projects a radial necrotic aura following g(r) = 15 / |r - 4|. As the player\'s radial distance r approaches 4, evaluate the limit and identify the lethal boundary.',
        mathematicalSolution: [
          'Step 1: Examine behavior as r approaches singularity radius r = 4:\n   lim (r → 4) [ 15 / |r - 4| ]',
          'Step 2: As r → 4, the denominator |r - 4| → 0⁺, so g(r) → +∞ (infinite limit).',
          'Step 3: Define safe operating distance:\n   For damage ≤ 5 HP/s: 15 / |r - 4| ≤ 5  ⟹  |r - 4| ≥ 3m  ⟹  r ≥ 7m.'
        ],
        gameplayEffect: 'A visible purple boundary ring marks r = 4. Inside the asymptotic threshold, player damage blows up to infinity; kiting Morgathia at r ≥ 7m minimizes damage taken!'
      }
    ];
  }

  getActiveCalculusTelemetry() {
    const ce = window.calculusEngine;
    if (!ce) return null;

    const timeOfDay = window.dayNightCycle ? window.dayNightCycle.timeOfDay : 12;
    const dayNight = ce.evalDayNightCalculus(timeOfDay);

    const now = Date.now() * 0.001;
    const platform = ce.evalOscillatingPlatform(now);
    const pendulum = ce.evalPendulumHazard(now);

    return {
      dayNight,
      platform,
      pendulum,
      riftSeal: ce.evalRiftSeal(2.98),
      bridge: ce.evalPiecewiseBridge(1.0),
      asymptote: ce.evalAsymptoteDanger(5.5),
      manaPlateau: ce.evalManaPlateau(now % 20)
    };
  }

  recordAnswer(isCorrect) {
    this.totalMechanicsTriggered++;
    if (isCorrect) this.totalSuccessSurges++;
  }

  getAccuracy() {
    return 100;
  }
}

window.CalculusManager = CalculusManager;
window.calculusManager = new CalculusManager();
