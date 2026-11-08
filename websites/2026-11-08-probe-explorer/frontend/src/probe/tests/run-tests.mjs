// Probe Explorer tests: geometry parameters, Topp, the drying model and the assembly rules.
// Plain node (no test framework dependency):  node src/probe/tests/run-tests.mjs
import assert from 'node:assert/strict';
import { topp, toppInverse, gravimetricTheta, awdState, awdTriggerDay, SPEC } from '../spec/physics.js';
import { checkAssembly, geometryChecks, CONTACTS } from '../spec/assembly.js';
import { cablePath, polylineLength, lyingPose, probeParts } from '../spec/layout.js';

let pass = 0, fail = 0;
const it = (name, fn) => {
  try { fn(); pass += 1; console.log(`  ok   ${name}`); }
  catch (e) { fail += 1; console.log(`  FAIL ${name}\n       ${e.message}`); }
};

console.log('Topp (1980)');
it('ε = 80 (water) gives θ ≈ 0.9+', () => assert.ok(topp(80) > 0.88 && topp(80) < 1.0, `θ=${topp(80)}`));
it('ε = 4 (dry soil) gives θ ≈ 0.05–0.07', () => assert.ok(topp(4) > 0.04 && topp(4) < 0.08, `θ=${topp(4)}`));
// published curve points (Topp et al. 1980, Eq. 7): ε 10 → 0.188, ε 20 → 0.343, ε 30 → 0.452 (approx.)
it('ε = 10 → θ ≈ 0.19', () => assert.ok(Math.abs(topp(10) - 0.188) < 0.01, `θ=${topp(10)}`));
it('ε = 20 → θ ≈ 0.34', () => assert.ok(Math.abs(topp(20) - 0.343) < 0.01, `θ=${topp(20)}`));
it('ε = 30 → θ ≈ 0.45', () => assert.ok(Math.abs(topp(30) - 0.452) < 0.015, `θ=${topp(30)}`));
it('inverse Topp round-trips', () => assert.ok(Math.abs(topp(toppInverse(0.3)) - 0.3) < 1e-6));
it('gravimetric θ = (m_wet − m_dry)/(ρ_w·V)', () => assert.equal(gravimetricTheta(260, 200, 150), 0.4));

console.log('AWD model (illustrative)');
it('starts flooded at +50 mm', () => assert.equal(awdState(0).level, 50));
it('reaches the −150 mm trigger on the stated day', () => assert.ok(Math.abs(awdState(awdTriggerDay()).level + 150) < 1e-9));
it('soil below the water table stays saturated', () => assert.equal(awdState(8).thetaAt(-200), 0.48));

console.log('Geometry parameters (± 0.5 mm)');
for (const g of geometryChecks()) it(g.name, () => assert.ok(g.pass));
it('pin map: E1 T9/GPIO32 … EREF T0/GPIO4', () => {
  const m = Object.fromEntries(SPEC.pins.hero.map(([n, g, t]) => [n.split(' ')[0], `${t}/${g}`]));
  assert.equal(m.E1, 'T9/GPIO32'); assert.equal(m.E2, 'T8/GPIO33'); assert.equal(m.E3, 'T7/GPIO27');
  assert.equal(m.E4, 'T6/GPIO14'); assert.equal(m.EW, 'T4/GPIO13'); assert.equal(m.EREF, 'T0/GPIO4');
});

console.log('Studio poses');
for (const kind of ['P1', 'P2']) {
  it(`${kind} lying on the floor touches it at the cap rim and the tube (gap ≤ 0.05 mm)`, () => {
    const p = lyingPose(kind); const P = probeParts(kind); const y0 = p.y0 * 1000, d = p.delta;
    const capLow = y0 + P.cap.y0 * Math.sin(d) - P.cap.r * Math.cos(d);
    const tubeLow = y0 + P.tip.yTop * Math.sin(d) - P.rOut * Math.cos(d);
    assert.ok(Math.abs(capLow) < 0.05 && Math.abs(tubeLow) < 0.05, `cap ${capLow.toFixed(3)} tube ${tubeLow.toFixed(3)}`);
  });
}

console.log('Assembly');
const res = checkAssembly();
for (const c of res.contacts) it(`${c.why}  [gap ${c.gap} mm]`, () => assert.ok(c.pass, `${c.a} ↔ ${c.b} gap ${c.gap}`));
it('no unintended intersections', () => assert.equal(res.intersections.length, 0, JSON.stringify(res.intersections)));
it('nothing floats: every part has a support chain to the ground', () => assert.equal(res.floating.length, 0, res.floating.join(', ')));
it(`probe lead length ${polylineLength(cablePath().pts).toFixed(0)} mm ≤ ${SPEC.P1.cable.maxLeadMm} mm`, () => assert.ok(polylineLength(cablePath().pts) <= SPEC.P1.cable.maxLeadMm));
it(`${CONTACTS.length} declared contacts`, () => assert.ok(CONTACTS.length >= 25));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
