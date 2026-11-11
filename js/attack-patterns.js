const enemyPatterns = {
  imp: { name: 'Grove Imp', move: 'Spark burst', kind: 'circle', range: 2.2, reach: 2.55, windup: 0.68, tip: 'Step outside the circle before it closes.' },
  wolf: { name: 'Shadow Wolf', move: 'Raking lunge', kind: 'lane', range: 4.8, reach: 5.2, width: 1.8, windup: 0.64, tip: 'Move sideways when the wolf crouches.' },
  scholar: { name: 'Skeleton Scholar', move: 'Grave bolt', kind: 'lane', range: 8.2, reach: 9, width: 1.4, windup: 0.92, tip: 'Leave the narrow lane or take cover.' },
  knight: { name: 'Undead Knight', move: 'Shield crush', kind: 'circle', range: 2.5, reach: 2.8, windup: 0.88, tip: 'Circle the shield or strike after the swing.' },
  mage: { name: 'Phantom Mage', move: 'Astral lance', kind: 'lane', range: 9, reach: 10, width: 2.1, windup: 0.91, tip: 'Watch the charging staff, then step out of its lane.' },
  phantom: { name: 'Dimensional Phantom', move: 'Rift pulse', kind: 'circle', range: 3.3, reach: 3.7, windup: 0.78, tip: 'Back away from the pulse, then close in.' },
  summoned: { name: 'Summoned Skeleton', move: 'Bone blade', kind: 'lane', range: 2.1, reach: 2.6, width: 1.55, windup: 0.57, tip: 'Step to the side when it raises its blade.' }
};

const bossPatterns = {
  ring: ['Asymptote ring', 'ring', 'The outer band is dangerous. Stand inside the ring or well beyond it.'],
  pendulum: ['Pendulum sweep', 'lane', 'Stay outside the rotating strip until it fades.'],
  slam: ['Staff slam', 'circle', 'Back out of the impact circle, then move in during recovery.'],
  summon: ['Summoning circle', 'circle', 'Stay clear of the circle and watch for skeletons at the sides.'],
  harmonic: ['Harmonic sweep', 'lane', 'The beam slows before reversing. Cross behind the sweep.'],
  dive: ['Aerial pass', 'lane', 'Dodge sideways out of the marked lane.'],
  sweep: ['Dragon sweep', 'lane', 'Move sideways and wait for the dragon to settle.']
};

function recordAttack(name, kind, tip) {
  const world = window.game?.world;
  const state = world?.dungeonProgress[world.currentRealm];
  if (!state) return;
  const patterns = state.patterns ??= {};
  patterns[name] = { kind, tip };
}
