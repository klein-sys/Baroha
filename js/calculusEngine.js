/**
 * THE FORBIDDEN REALM: THE TRIALS OF KNOWLEDGE
 * Calculus Engine - Pure Mathematical Core
 *
 * Implements exact differential calculus formulas for:
 * (A) LIMITS AND CONTINUITY:
 *   - Removable discontinuity & left/right approach tables (f(x) = (x^2 - 9)/(x - 3))
 *   - Piecewise continuity conditions (f(x) = kx + 3 vs x^2 + 1 at x = 2)
 *   - Infinite limits & vertical asymptotes (g(x) = k / (x - a))
 *   - Horizontal asymptote plateaus (M(t) = 100t / (t + 5))
 *   - Intermediate Value Theorem root-finding via bisection
 *   - Small-angle trigonometric limit (lim x->0 sin(x)/x = 1)
 *
 * (B) BASIC TRIGONOMETRIC DERIVATIVES:
 *   - Celestial day/night cycle: L(t) = sin(wt), dL/dt = w*cos(wt)
 *   - Harmonic oscillating platforms: y(t) = A*sin(wt), v(t) = A*w*cos(wt), a(t) = -A*w^2*sin(wt)
 *   - Pendulum & orbital hazards: theta(t) = theta0*cos(wt), omega(t) = -theta0*w*sin(wt)
 *   - Tangent slope aiming: y = A*sin(kx), dy/dx = A*k*cos(kx)
 *   - Pulse spell charge timing: D(t) = A*sin(wt), D'(t) = A*w*cos(wt)
 */

class CalculusEngine {
  // =========================================================================
  // (A) LIMITS AND CONTINUITY
  // =========================================================================

  /**
   * Evaluate left-hand limit approaching targetX.
   */
  evaluateLimitLeft(f, targetX, step = 0.001) {
    return f(targetX - step);
  }

  /**
   * Evaluate right-hand limit approaching targetX.
   */
  evaluateLimitRight(f, targetX, step = 0.001) {
    return f(targetX + step);
  }

  /**
   * Generate an approach table for a function f around point a.
   */
  getApproachTable(f, a, deltas = [0.1, 0.01, 0.001]) {
    const left = deltas.map(d => {
      const x = a - d;
      return { x: Number(x.toFixed(4)), fx: f(x) };
    });
    const right = deltas.map(d => {
      const x = a + d;
      return { x: Number(x.toFixed(4)), fx: f(x) };
    });
    const leftLimit = f(a - 0.0001);
    const rightLimit = f(a + 0.0001);
    const hasLimit = Math.abs(leftLimit - rightLimit) < 0.01;
    return {
      a,
      left,
      right,
      leftLimit,
      rightLimit,
      limit: hasLimit ? (leftLimit + rightLimit) / 2 : null
    };
  }

  /**
   * Rift Seal (Removable Discontinuity):
   * f(x) = (x^2 - 9) / (x - 3) = (x - 3)(x + 3) / (x - 3)
   * Undefined at x = 3.
   * Limit as x -> 3 is 6.
   */
  evalRiftSeal(x, a = 3) {
    const isHole = Math.abs(x - a) < 0.0001;
    const value = isHole ? null : (x * x - a * a) / (x - a);
    const limit = 2 * a; // by factoring (x-a)(x+a)/(x-a) = x+a -> 2a
    const diffFromTarget = Math.abs(x - a);
    const isApproaching = diffFromTarget < 0.35 && !isHole;
    const power = isHole ? 0 : value;
    const isBreached = Math.abs(power - limit) <= 0.15 && !isHole;

    return {
      x,
      targetX: a,
      isHole,
      value,
      limit,
      power,
      isApproaching,
      isBreached,
      approachTable: [
        { x: a - 0.1, fx: (a - 0.1) + a },
        { x: a - 0.01, fx: (a - 0.01) + a },
        { x: a + 0.01, fx: (a + 0.01) + a },
        { x: a + 0.1, fx: (a + 0.1) + a }
      ]
    };
  }

  /**
   * Broken Bridge (Piecewise Continuity):
   * f(x) = kx + 3 for x <= 2
   * f(x) = x^2 + 1 for x > 2
   * Continuous at x = 2 iff lim x->2- = lim x->2+ = f(2)
   * Left: 2k + 3. Right: 2^2 + 1 = 5.
   * Continuity achieved when 2k + 3 = 5 => k = 1.
   */
  evalPiecewiseBridge(k, a = 2) {
    const leftLimit = k * a + 3;
    const rightLimit = a * a + 1;
    const fAtA = k * a + 3;
    const jump = Math.abs(leftLimit - rightLimit);
    const isContinuous = jump < 0.05;

    return {
      k,
      a,
      leftLimit,
      rightLimit,
      fAtA,
      jump,
      isContinuous,
      requiredK: (rightLimit - 3) / a // 1.0
    };
  }

  /**
   * Asymptote Danger Zone (Infinite Limits):
   * g(r) = k / |r - a|
   * Vertical asymptote at r = a (singularity).
   * Damage blows up to infinity as r -> a.
   */
  evalAsymptoteDanger(r, a = 4, k = 15) {
    const distToAsymptote = Math.abs(r - a);
    const isAtSingularity = distToAsymptote < 0.05;
    const intensity = isAtSingularity ? 9999 : k / distToAsymptote;
    const inDangerZone = distToAsymptote < 2.0;

    return {
      r,
      a,
      distToAsymptote,
      intensity,
      inDangerZone,
      isDeadly: distToAsymptote < 0.4
    };
  }

  /**
   * Horizontal Asymptote (Mana Well Plateau):
   * M(t) = maxMana * t / (t + k)
   * As t -> infinity, M(t) -> maxMana.
   */
  evalManaPlateau(t, maxMana = 100, k = 5) {
    if (t < 0) t = 0;
    const current = (maxMana * t) / (t + k);
    const rateOfRegen = (maxMana * k) / Math.pow(t + k, 2); // quotient rule
    return {
      t,
      current,
      asymptote: maxMana,
      rateOfRegen
    };
  }

  /**
   * Intermediate Value Theorem & Bisection Root Finder:
   * Continuous energy profile f(x). If f(a)*f(b) < 0, a root exists in (a, b).
   * Each step halves the interval to locate the hidden treasure / portal coordinate.
   */
  bisectionStep(f, a, b) {
    const fa = f(a);
    const fb = f(b);
    const mid = (a + b) / 2;
    const fmid = f(mid);
    const signChange = (fa * fb) <= 0;

    let nextA = a;
    let nextB = b;

    if (signChange) {
      if ((fa * fmid) <= 0) {
        nextB = mid;
      } else {
        nextA = mid;
      }
    }

    const intervalWidth = Math.abs(nextB - nextA);
    const isRootFound = Math.abs(fmid) < 0.02 || intervalWidth < 0.1;

    return {
      a,
      b,
      mid,
      fa,
      fb,
      fmid,
      signChange,
      nextA,
      nextB,
      intervalWidth,
      isRootFound
    };
  }

  /**
   * Key Limit: lim x->0 sin(x)/x = 1
   * Used for small-angle aiming assist convergence.
   */
  smallAngleLimit(theta) {
    if (Math.abs(theta) < 0.00001) return 1.0;
    return Math.sin(theta) / theta;
  }

  // =========================================================================
  // (B) BASIC TRIGONOMETRIC DERIVATIVES
  // =========================================================================

  /**
   * Derivative of sin(wt): d/dt [A * sin(wt)] = A * w * cos(wt)
   */
  derivSin(t, omega = 1, A = 1) {
    return A * omega * Math.cos(omega * t);
  }

  /**
   * Derivative of cos(wt): d/dt [A * cos(wt)] = -A * w * sin(wt)
   */
  derivCos(t, omega = 1, A = 1) {
    return -A * omega * Math.sin(omega * t);
  }

  /**
   * Derivative of tan(wt): d/dt [A * tan(wt)] = A * w * sec^2(wt) = A * w / cos^2(wt)
   */
  derivTan(t, omega = 1, A = 1) {
    const c = Math.cos(omega * t);
    if (Math.abs(c) < 0.0001) return Infinity;
    return (A * omega) / (c * c);
  }

  /**
   * Day / Night Celestial Calculus:
   * Light level L(t) = sin(w * (t - 6)) where t is in hours (0 to 24).
   * w = 2*PI / 24 = PI / 12.
   * Dimming rate dL/dt = w * cos(w * (t - 6)).
   * Dusk occurs when L crosses 0 downward (around 18:00 / 6:00 PM) where -dL/dt is at maximum!
   */
  evalDayNightCalculus(timeOfDay) {
    const omega = Math.PI / 12; // 2*PI / 24
    const angle = omega * (timeOfDay - 6.0);
    const L = Math.sin(angle);
    const dLdt = omega * Math.cos(angle);
    const isDay = L > 0;
    const isNight = L <= 0;
    const dimmingRate = -dLdt; // positive when getting darker (afternoon/dusk)
    const monsterAggression = isNight ? (1.0 + Math.max(0, dimmingRate * 2.0)) : 0.6;

    return {
      timeOfDay,
      L,
      dLdt,
      isDay,
      isNight,
      dimmingRate,
      monsterAggression
    };
  }

  /**
   * Oscillating Platform Dynamics:
   * Position y(t) = A * sin(w * t)
   * Velocity v(t) = A * w * cos(w * t)  [first derivative]
   * Acceleration a(t) = -A * w^2 * sin(w * t)  [second derivative]
   * Peak height occurs when v(t) = 0 (turning point, stationary, safe jump!).
   */
  evalOscillatingPlatform(t, A = 3.5, omega = 1.2) {
    const y = A * Math.sin(omega * t);
    const v = A * omega * Math.cos(omega * t);
    const a = -A * omega * omega * Math.sin(omega * t);
    const isAtPeak = Math.abs(v) < 0.35; // safe window for landing/jumping
    const isMaxSpeed = Math.abs(v) > (A * omega * 0.85);

    return {
      t,
      A,
      omega,
      y,
      v,
      a,
      isAtPeak,
      isMaxSpeed,
      statusText: isAtPeak
        ? 'STATIONARY PEAK (v ≈ 0) — SAFE TO BOARD / LEAP'
        : (v > 0 ? `ASCENDING (v = +${v.toFixed(2)} m/s)` : `DESCENDING (v = ${v.toFixed(2)} m/s)`)
    };
  }

  /**
   * Pendulum / Orbiting Hazard Dynamics:
   * Angular position theta(t) = theta0 * cos(w * t)
   * Angular velocity omega(t) = -theta0 * w * sin(w * t)
   * Hazard is slowest at extreme turning points theta = +/- theta0 where angular velocity = 0!
   */
  evalPendulumHazard(t, theta0 = Math.PI / 3, omega = 2.0) {
    const theta = theta0 * Math.cos(omega * t);
    const angVel = -theta0 * omega * Math.sin(omega * t);
    const isTurningPoint = Math.abs(angVel) < 0.25;

    return {
      t,
      theta,
      angVel,
      speed: Math.abs(angVel),
      isTurningPoint,
      safeToDash: isTurningPoint
    };
  }

  /**
   * Sine-Wave Projectile & Tangent Aim:
   * Trajectory y(x) = A * sin(k * x)
   * Tangent slope m = dy/dx = A * k * cos(k * x)
   * Impact angle alpha = atan(m)
   */
  evalTangentAim(x, A = 2.0, k = 0.5) {
    const y = A * Math.sin(k * x);
    const slope = A * k * Math.cos(k * x);
    const angleRad = Math.atan(slope);
    const angleDeg = (angleRad * 180) / Math.PI;

    return {
      x,
      y,
      slope,
      angleRad,
      angleDeg
    };
  }

  /**
   * Pulse Spell Charge Timing:
   * Damage profile D(t) = A * sin(w * t) (scaled to positive values)
   * Rate of change D'(t) = A * w * cos(w * t)
   * Peak release occurs when D'(t) = 0 at maximum amplitude.
   */
  evalPulseCharge(chargeTime, A = 100, omega = 3.0) {
    const rawVal = Math.sin(omega * chargeTime);
    const normalized = (rawVal + 1) / 2; // 0 to 1
    const damage = 20 + normalized * (A - 20);
    const rateOfChange = A * omega * Math.cos(omega * chargeTime);
    const isPeak = Math.abs(rateOfChange) < (A * omega * 0.15) && rawVal > 0.8;

    return {
      chargeTime,
      damage,
      rateOfChange,
      isPeak,
      normalized
    };
  }
}

// Global Singleton Instance
window.CalculusEngine = CalculusEngine;
window.calculusEngine = new CalculusEngine();
