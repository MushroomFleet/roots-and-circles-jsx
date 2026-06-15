import React, { useState, useMemo } from "react";

/**
 * Roots & Circles — an interactive worktable.
 *
 * Ties together everything from the conversation: square roots, exact surd
 * forms, fraction forms, and the "circular" (trigonometric) functions, with a
 * live unit circle as the signature element. Pick a row and watch the angle
 * swing around the circle; sin and cos are the shadows it casts.
 */

// ---------- math helpers ----------

const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
};

// Simplify sqrt(n) for a positive integer n -> { coef, rad }, meaning coef * sqrt(rad).
const simplifyIntSqrt = (n) => {
  if (n === 0) return { coef: 0, rad: 1 };
  let coef = 1;
  let rad = n;
  for (let f = 2; f * f <= rad; f++) {
    while (rad % (f * f) === 0) {
      rad /= f * f;
      coef *= f;
    }
  }
  return { coef, rad };
};

// Simplify sqrt(num/den) with denominator rationalised -> { coef, rad, den }
// meaning (coef * sqrt(rad)) / den.
const simplifyFracSqrt = (num, den) => {
  // sqrt(num/den) = sqrt(num*den) / den
  const { coef, rad } = simplifyIntSqrt(num * den);
  const g = gcd(coef, den);
  return { coef: coef / g, rad, den: den / g };
};

// Educational annotations: which rows are "famous" figures, and why.
// Returns an array of { tag, kind, title, text }.
const notesFor = (r) => {
  const notes = [];
  const isSquare = r.den === 1 && Number.isInteger(r.sqrt);
  if (isSquare) {
    notes.push({
      tag: `=${r.sqrt}`,
      kind: "square",
      title: "Perfect square",
      text: `√${r.num} = ${r.sqrt} exactly. The value is rational, so the decimal terminates instead of running forever.`,
    });
  }
  if (r.den === 1 && r.num === 2) {
    notes.push({
      tag: "√2",
      kind: "star",
      title: "Pythagoras's constant",
      text: "The diagonal of a unit square: 1² + 1² = 2. Famously the first number proven irrational, around 500 BC — 1.41421356… never repeats or ends.",
    });
  }
  if (r.den === 1 && r.num === 3) {
    notes.push({
      tag: "√3",
      kind: "star",
      title: "Theodorus's constant",
      text: "An equilateral triangle's height is (√3⁄2) × its side. This is the number hiding inside every 30–60–90 triangle.",
    });
  }
  if (r.den === 1 && r.num === 5) {
    notes.push({
      tag: "φ",
      kind: "star",
      title: "Seed of the golden ratio",
      text: "φ = (1 + √5)⁄2 ≈ 1.61803. √5 is the irrational core of the golden ratio and the Fibonacci sequence.",
    });
  }
  if (r.den === 1 && r.num === 8) {
    notes.push({
      tag: "2√2",
      kind: "link",
      title: "Twice the diagonal",
      text: "√8 = 2√2 — exactly double √2. A clean example of pulling a square factor out from under the root.",
    });
  }
  if (Math.abs(r.value - 0.5) < 1e-12) {
    notes.push({
      tag: "1⁄√2",
      kind: "star",
      title: "The reciprocal of √2",
      text: "√0.5 = √2⁄2 = 1⁄√2 = cos 45° = sin 45° ≈ 0.70711. Multiply it by √2 and you land back on 1.",
    });
  }
  return notes;
};

// ---------- datasets ----------

const buildIntegers = (max) =>
  Array.from({ length: max }, (_, i) => {
    const n = i + 1;
    return { key: `i${n}`, num: n, den: 1 };
  });

const DECIMALS = [9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => {
  const g = gcd(n, 10);
  return { key: `d0.${n}`, num: n / g, den: 10 / g };
});

const PRIMES_BELOW_ONE = [
  { num: 1, den: 5 }, // 0.2
  { num: 3, den: 10 }, // 0.3
  { num: 1, den: 2 }, // 0.5
  { num: 7, den: 10 }, // 0.7
  { num: 11, den: 100 },
  { num: 13, den: 100 },
  { num: 17, den: 100 },
  { num: 19, den: 100 },
  { num: 23, den: 100 },
  { num: 29, den: 100 },
].map((r) => ({ ...r, key: `p${r.num}/${r.den}` }));

// ---------- small render helpers ----------

const fmt = (x, dp) => {
  if (!isFinite(x)) return "∞";
  return x.toFixed(dp);
};

// A radical with a true overline over the radicand, optionally a coefficient
// and a fraction denominator (drawn with a vinculum).
function Radical({ coef = 1, rad, den = 1 }) {
  // Whole number — no radical needed.
  if (rad === 1) {
    const whole = coef / den;
    if (Number.isInteger(whole)) return <span className="rc-num">{whole}</span>;
  }
  const top = (
    <span className="rc-rad">
      {coef !== 1 && <span className="rc-coef">{coef}</span>}
      <span className="rc-surd">√</span>
      <span className="rc-radicand">{rad}</span>
    </span>
  );
  if (den === 1) return top;
  return (
    <span className="rc-frac">
      <span className="rc-frac-top">{top}</span>
      <span className="rc-frac-bot">{den}</span>
    </span>
  );
}

function Fraction({ num, den }) {
  if (den === 1) return <span className="rc-num">{num}</span>;
  return (
    <span className="rc-frac">
      <span className="rc-frac-top">{num}</span>
      <span className="rc-frac-bot">{den}</span>
    </span>
  );
}

// ---------- the unit circle signature ----------

function UnitCircle({ value, dp }) {
  const S = 240;
  const cx = S / 2;
  const cy = S / 2;
  const R = 92;
  const angle = value; // radians
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const px = cx + cos * R;
  const py = cy - sin * R;
  const turns = Math.floor(value / (2 * Math.PI));
  const reduced = value - turns * 2 * Math.PI;

  // Arc path from angle 0 round to the current angle (can exceed 2π visually
  // capped at one lap, since the swept arc repeats).
  const sweep = Math.min(reduced, 2 * Math.PI);
  const ex = cx + Math.cos(sweep) * (R * 0.34);
  const ey = cy - Math.sin(sweep) * (R * 0.34);
  const largeArc = sweep > Math.PI ? 1 : 0;
  const arcPath = `M ${cx + R * 0.34} ${cy} A ${R * 0.34} ${R * 0.34} 0 ${largeArc} 0 ${ex} ${ey}`;

  return (
    <div className="rc-circlewrap">
      <svg viewBox={`0 0 ${S} ${S}`} className="rc-svg" role="img"
           aria-label={`Unit circle at ${value.toFixed(3)} radians`}>
        {/* grid axes */}
        <line x1={cx - R - 18} y1={cy} x2={cx + R + 18} y2={cy} className="rc-axis" />
        <line x1={cx} y1={cy - R - 18} x2={cx} y2={cy + R + 18} className="rc-axis" />
        {/* the circle */}
        <circle cx={cx} cy={cy} r={R} className="rc-ring" />
        {/* quadrant landmarks — where sin and cos change sign */}
        {[
          { a: 0, label: "0" },
          { a: Math.PI / 2, label: "π/2" },
          { a: Math.PI, label: "π" },
          { a: (3 * Math.PI) / 2, label: "3π/2" },
        ].map((t, k) => {
          const tx = cx + Math.cos(t.a) * R;
          const ty = cy - Math.sin(t.a) * R;
          const lx = cx + Math.cos(t.a) * (R + 16);
          const ly = cy - Math.sin(t.a) * (R + 16);
          return (
            <g key={k}>
              <circle cx={tx} cy={ty} r={2.4} className="rc-tick" />
              <text x={lx} y={ly} className="rc-ticklabel"
                    textAnchor="middle" dominantBaseline="middle">{t.label}</text>
            </g>
          );
        })}
        {/* swept angle arc */}
        <path d={arcPath} className="rc-arc" />
        {/* cos projection (horizontal shadow) */}
        <line x1={cx} y1={py} x2={px} y2={py} className="rc-cos" />
        <line x1={px} y1={cy} x2={px} y2={py} className="rc-drop" />
        {/* sin projection (vertical shadow) */}
        <line x1={px} y1={cy} x2={cx} y2={cy} className="rc-sin-base" />
        {/* radius */}
        <line x1={cx} y1={cy} x2={px} y2={py} className="rc-radius" />
        {/* the travelling point */}
        <circle cx={px} cy={py} r={5.5} className="rc-point" />
        <circle cx={cx} cy={cy} r={2.5} className="rc-origin" />
      </svg>
      <div className="rc-readout">
        <div className="rc-readrow">
          <span className="rc-tag rc-tag-cos">cos</span>
          <span className="rc-readval">{fmt(cos, dp)}</span>
        </div>
        <div className="rc-readrow">
          <span className="rc-tag rc-tag-sin">sin</span>
          <span className="rc-readval">{fmt(sin, dp)}</span>
        </div>
        <div className="rc-readrow rc-readrow-quiet">
          <span className="rc-tag">turns</span>
          <span className="rc-readval">{turns} + {reduced.toFixed(3)} rad</span>
        </div>
      </div>
      <p className="rc-circlecap">
        The marked points are the quarter-turns. Cross one and either sin or cos
        flips sign — that's why the table's trig columns go negative and back.
      </p>
    </div>
  );
}

// ---------- main ----------

export default function RootsAndCircles() {
  const [mode, setMode] = useState("integers");
  const [intMax, setIntMax] = useState(9);
  const [dp, setDp] = useState(6);
  const [showCircular, setShowCircular] = useState(true);
  const [showGeometry, setShowGeometry] = useState(false);
  const [highlights, setHighlights] = useState(true);
  const [selected, setSelected] = useState(1); // index into the active dataset

  const rows = useMemo(() => {
    let raw;
    if (mode === "integers") raw = buildIntegers(intMax);
    else if (mode === "decimals") raw = DECIMALS;
    else raw = PRIMES_BELOW_ONE;

    return raw.map((r) => {
      const value = r.num / r.den;
      const surd =
        r.den === 1
          ? { ...simplifyIntSqrt(r.num), den: 1 }
          : simplifyFracSqrt(r.num, r.den);
      const row = {
        ...r,
        value,
        surd,
        sqrt: Math.sqrt(value),
        sin: Math.sin(value),
        cos: Math.cos(value),
        tan: Math.tan(value),
        circ: 2 * Math.PI * value,
        area: Math.PI * value * value,
      };
      row.notes = notesFor(row);
      return row;
    });
  }, [mode, intMax]);

  const safeSelected = selected < rows.length ? selected : 0;
  const sel = rows[safeSelected];

  const showFraction = mode !== "integers";

  const Seg = ({ active, onClick, children }) => (
    <button className={`rc-seg ${active ? "rc-seg-on" : ""}`} onClick={onClick}>
      {children}
    </button>
  );

  return (
    <div className="rc-root">
      <style>{CSS}</style>

      <header className="rc-head">
        <div className="rc-eyebrow">a worktable for</div>
        <h1 className="rc-title">
          Roots <span className="rc-amp">&amp;</span> Circles
        </h1>
        <p className="rc-sub">
          Square roots, their exact surd forms, and the circular functions —
          for one spine of numbers. Pick a row; the circle treats its value as
          an angle in radians and casts <em>cos</em> and <em>sin</em> as shadows.
        </p>
      </header>

      <div className="rc-controls">
        <div className="rc-ctrlgroup">
          <div className="rc-ctrllabel">direction</div>
          <div className="rc-segrow">
            <Seg active={mode === "integers"} onClick={() => { setMode("integers"); setSelected(1); }}>
              Integers ↑
            </Seg>
            <Seg active={mode === "decimals"} onClick={() => { setMode("decimals"); setSelected(0); }}>
              Decimals ↓
            </Seg>
            <Seg active={mode === "primes"} onClick={() => { setMode("primes"); setSelected(0); }}>
              Primes &lt; 1
            </Seg>
          </div>
        </div>

        {mode === "integers" && (
          <div className="rc-ctrlgroup">
            <div className="rc-ctrllabel">reach</div>
            <div className="rc-segrow">
              {[9, 12, 16, 20].map((m) => (
                <Seg key={m} active={intMax === m} onClick={() => setIntMax(m)}>
                  1–{m}
                </Seg>
              ))}
            </div>
          </div>
        )}

        <div className="rc-ctrlgroup rc-grow">
          <div className="rc-ctrllabel">precision · {dp} dp</div>
          <input
            type="range" min={0} max={10} value={dp}
            onChange={(e) => setDp(Number(e.target.value))}
            className="rc-slider"
            aria-label="decimal places"
          />
        </div>

        <div className="rc-ctrlgroup">
          <div className="rc-ctrllabel">columns</div>
          <div className="rc-segrow">
            <Seg active={showCircular} onClick={() => setShowCircular((v) => !v)}>
              sin · cos · tan
            </Seg>
            <Seg active={showGeometry} onClick={() => setShowGeometry((v) => !v)}>
              circle 2πr · πr²
            </Seg>
            <Seg active={highlights} onClick={() => setHighlights((v) => !v)}>
              ★ highlights
            </Seg>
          </div>
        </div>
      </div>

      <div className="rc-body">
        <div className="rc-tablewrap">
          <table className="rc-table">
            <thead>
              <tr>
                <th className="rc-th-n">n</th>
                {showFraction && <th>fraction</th>}
                <th>√ exact</th>
                <th>√ decimal</th>
                {showCircular && <th>sin</th>}
                {showCircular && <th>cos</th>}
                {showCircular && <th>tan</th>}
                {showGeometry && <th>2πr</th>}
                {showGeometry && <th>πr²</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const noted = highlights && r.notes.length > 0;
                return (
                <tr
                  key={r.key}
                  className={`${i === safeSelected ? "rc-tr-sel" : ""} ${noted ? "rc-tr-note" : ""}`}
                  onClick={() => setSelected(i)}
                >
                  <td className="rc-td-n">
                    <span className="rc-nval">
                      {r.den === 1 ? r.num : (r.num / r.den).toString().replace(/^0\./, ".")}
                    </span>
                    {noted && (
                      <span className="rc-badges">
                        {r.notes.map((n, k) => (
                          <span key={k} className={`rc-badge rc-badge-${n.kind}`} title={n.title}>
                            {n.tag}
                          </span>
                        ))}
                      </span>
                    )}
                  </td>
                  {showFraction && (
                    <td><Fraction num={r.num} den={r.den} /></td>
                  )}
                  <td className="rc-td-surd">
                    <Radical coef={r.surd.coef} rad={r.surd.rad} den={r.surd.den} />
                  </td>
                  <td className="rc-mono rc-strong">{fmt(r.sqrt, dp)}</td>
                  {showCircular && <td className="rc-mono">{fmt(r.sin, dp)}</td>}
                  {showCircular && (
                    <td className="rc-mono">{fmt(r.cos, dp)}</td>
                  )}
                  {showCircular && (
                    <td className="rc-mono rc-tan">{fmt(r.tan, dp)}</td>
                  )}
                  {showGeometry && <td className="rc-mono">{fmt(r.circ, dp)}</td>}
                  {showGeometry && <td className="rc-mono">{fmt(r.area, dp)}</td>}
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <aside className="rc-aside">
          <div className="rc-asidehead">
            <span className="rc-asidetag">selected</span>
            <span className="rc-asideval">{sel ? (sel.den === 1 ? sel.num : sel.value) : "—"}</span>
          </div>
          {sel && <UnitCircle value={sel.value} dp={Math.min(dp, 6)} />}
          {sel && (
            <div className="rc-facts">
              <div className="rc-fact">
                <span>√{sel.den === 1 ? sel.num : sel.value}</span>
                <span className="rc-mono">= {fmt(sel.sqrt, dp)}</span>
              </div>
              <div className="rc-fact">
                <span>sin² + cos²</span>
                <span className="rc-mono">= {fmt(sel.sin * sel.sin + sel.cos * sel.cos, dp)}</span>
              </div>
            </div>
          )}
          {highlights && sel && sel.notes.length > 0 && (
            <div className="rc-fieldnotes">
              {sel.notes.map((n, k) => (
                <div key={k} className={`rc-fieldnote rc-fn-${n.kind}`}>
                  <div className="rc-fn-head">
                    <span className="rc-fn-tag">{n.tag}</span>
                    <span className="rc-fn-title">{n.title}</span>
                  </div>
                  <p className="rc-fn-text">{n.text}</p>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      <footer className="rc-foot">
        <span className="rc-surd">√</span>0.5 = <Radical coef={1} rad={2} den={2} /> is the exact
        reciprocal of <span className="rc-surd">√</span>2 — they multiply back to 1, the value you
        started and ended on.
      </footer>
    </div>
  );
}

// ---------- styling ----------

const CSS = `
.rc-root{
  --ink:#16223a;          /* deep navy ink */
  --paper:#f3efe4;        /* warm drafting paper */
  --grid:#d9d2bf;
  --rule:#c8c0aa;
  --muted:#7c7563;
  --vermilion:#d8492b;    /* selected / sin */
  --teal:#1f8a7a;         /* cos / geometry */
  --gold:#b8852a;         /* tan */
  background:var(--paper);
  color:var(--ink);
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  padding:30px 32px 26px;
  border:1px solid var(--rule);
  background-image:
    linear-gradient(var(--grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid) 1px, transparent 1px);
  background-size:26px 26px;
  background-position:-1px -1px;
}
.rc-root *{box-sizing:border-box;}

.rc-head{max-width:620px;margin-bottom:22px;}
.rc-eyebrow{
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size:11px; letter-spacing:.34em; text-transform:uppercase;
  color:var(--muted); margin-bottom:6px;
}
.rc-title{
  font-family: Georgia, "Times New Roman", serif;
  font-size:46px; line-height:.95; font-weight:600; margin:0;
  letter-spacing:-.01em;
}
.rc-amp{ color:var(--vermilion); font-style:italic; }
.rc-sub{
  margin:12px 0 0; max-width:560px; font-size:14px; line-height:1.55;
  color:#3a4254;
}
.rc-sub em{ font-style:italic; }

.rc-controls{
  display:flex; flex-wrap:wrap; gap:22px 30px; align-items:flex-end;
  padding:16px 0; margin-bottom:18px;
  border-top:1.5px solid var(--ink); border-bottom:1px solid var(--rule);
}
.rc-ctrlgroup{ display:flex; flex-direction:column; gap:8px; }
.rc-grow{ flex:1 1 180px; min-width:160px; }
.rc-ctrllabel{
  font-family: ui-monospace, monospace; font-size:11px;
  letter-spacing:.16em; text-transform:uppercase; color:var(--muted);
}
.rc-segrow{ display:flex; flex-wrap:wrap; gap:6px; }
.rc-seg{
  font-family: ui-monospace, monospace; font-size:12.5px;
  padding:6px 11px; background:transparent; color:var(--ink);
  border:1px solid var(--rule); border-radius:0; cursor:pointer;
  transition:background .12s, color .12s, border-color .12s;
}
.rc-seg:hover{ border-color:var(--ink); }
.rc-seg-on{ background:var(--ink); color:var(--paper); border-color:var(--ink); }
.rc-seg:focus-visible{ outline:2px solid var(--vermilion); outline-offset:2px; }

.rc-slider{ -webkit-appearance:none; width:100%; height:2px; background:var(--rule); cursor:pointer; }
.rc-slider:focus-visible{ outline:2px solid var(--vermilion); outline-offset:6px; }
.rc-slider::-webkit-slider-thumb{
  -webkit-appearance:none; width:15px; height:15px; border-radius:50%;
  background:var(--vermilion); border:2px solid var(--paper); box-shadow:0 0 0 1px var(--vermilion);
}
.rc-slider::-moz-range-thumb{
  width:15px; height:15px; border-radius:50%; background:var(--vermilion);
  border:2px solid var(--paper); box-shadow:0 0 0 1px var(--vermilion);
}

.rc-body{ display:flex; gap:26px; align-items:flex-start; flex-wrap:wrap; }
.rc-tablewrap{ flex:1 1 440px; overflow-x:auto; }

.rc-table{ border-collapse:collapse; width:100%; font-size:14px; }
.rc-table thead th{
  text-align:right; font-family: ui-monospace, monospace; font-weight:500;
  font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--muted);
  padding:0 14px 9px; border-bottom:1.5px solid var(--ink); white-space:nowrap;
}
.rc-th-n{ text-align:left !important; }
.rc-table tbody td{
  text-align:right; padding:9px 14px; border-bottom:1px solid var(--rule);
  white-space:nowrap;
}
.rc-table tbody tr{ cursor:pointer; transition:background .1s; }
.rc-table tbody tr:hover{ background:rgba(22,34,58,.05); }
.rc-tr-sel{ background:rgba(216,73,43,.10) !important; }
.rc-tr-sel td{ border-bottom-color:var(--vermilion); }

.rc-td-n{ text-align:left !important; font-family: ui-monospace, monospace;
  font-size:15px; font-weight:600; }
.rc-tr-sel .rc-td-n{ color:var(--vermilion); }
.rc-nval{ display:inline-block; min-width:1.4em; }

/* highlighted notable rows */
.rc-tr-note td{ background:linear-gradient(90deg, rgba(184,133,42,.10), transparent 60%); }
.rc-tr-note .rc-td-n{ box-shadow:inset 3px 0 0 var(--gold); }
.rc-tr-sel.rc-tr-note td{ background:rgba(216,73,43,.10); }
.rc-tr-sel.rc-tr-note .rc-td-n{ box-shadow:inset 3px 0 0 var(--vermilion); }

.rc-badges{ display:inline-flex; gap:4px; margin-left:8px; vertical-align:middle; }
.rc-badge{
  font-family: ui-monospace, monospace; font-size:10.5px; font-weight:600;
  letter-spacing:.02em; padding:1px 6px; border:1px solid; border-radius:999px;
  line-height:1.5; white-space:nowrap;
}
.rc-badge-star{ color:var(--vermilion); border-color:var(--vermilion); background:rgba(216,73,43,.07); }
.rc-badge-square{ color:var(--teal); border-color:var(--teal); background:rgba(31,138,122,.07); }
.rc-badge-link{ color:var(--gold); border-color:var(--gold); background:rgba(184,133,42,.07); }

.rc-mono{ font-family: ui-monospace, "SF Mono", Menlo, monospace; font-variant-numeric:tabular-nums; }
.rc-strong{ font-weight:600; }
.rc-tan{ color:var(--gold); }
.rc-num{ font-family: ui-monospace, monospace; }

/* radicals */
.rc-td-surd{ font-size:15px; }
.rc-rad{ display:inline-flex; align-items:flex-start; }
.rc-coef{ font-family: ui-monospace, monospace; margin-right:1px; }
.rc-surd{ font-family: Georgia, serif; }
.rc-radicand{
  font-family: ui-monospace, monospace; border-top:1.5px solid currentColor;
  padding:0 2px; margin-top:1px; line-height:1.1;
}
.rc-frac{ display:inline-flex; flex-direction:column; align-items:center;
  vertical-align:middle; line-height:1; }
.rc-frac-top{ padding:0 4px 1px; }
.rc-frac-bot{ padding:1px 4px 0; border-top:1.5px solid currentColor;
  font-family: ui-monospace, monospace; }

/* aside / circle */
.rc-aside{
  flex:0 0 268px; background:var(--ink); color:var(--paper);
  padding:18px 18px 20px; align-self:stretch;
}
.rc-asidehead{ display:flex; justify-content:space-between; align-items:baseline;
  border-bottom:1px solid rgba(243,239,228,.2); padding-bottom:10px; margin-bottom:6px; }
.rc-asidetag{ font-family: ui-monospace, monospace; font-size:11px;
  letter-spacing:.2em; text-transform:uppercase; color:#9aa6bd; }
.rc-asideval{ font-family: Georgia, serif; font-size:26px; }

.rc-circlewrap{ display:flex; flex-direction:column; align-items:center; }
.rc-svg{ width:100%; max-width:240px; }
.rc-axis{ stroke:rgba(243,239,228,.22); stroke-width:1; }
.rc-ring{ fill:none; stroke:rgba(243,239,228,.55); stroke-width:1.5; }
.rc-arc{ fill:none; stroke:#9aa6bd; stroke-width:1.5; }
.rc-radius{ stroke:var(--paper); stroke-width:2; }
.rc-cos{ stroke:var(--teal); stroke-width:2; }
.rc-sin-base{ stroke:var(--vermilion); stroke-width:2; }
.rc-drop{ stroke:var(--vermilion); stroke-width:1; stroke-dasharray:3 3; opacity:.7; }
.rc-point{ fill:var(--vermilion); stroke:var(--paper); stroke-width:1.5;
  transition:cx .35s cubic-bezier(.4,0,.2,1), cy .35s cubic-bezier(.4,0,.2,1); }
.rc-origin{ fill:var(--paper); }

.rc-readout{ width:100%; margin-top:12px; }
.rc-readrow{ display:flex; justify-content:space-between; align-items:center;
  padding:5px 0; border-bottom:1px solid rgba(243,239,228,.12); }
.rc-readrow-quiet{ opacity:.62; }
.rc-tag{ font-family: ui-monospace, monospace; font-size:11px;
  letter-spacing:.1em; text-transform:uppercase; color:#9aa6bd; }
.rc-tag-cos{ color:var(--teal); }
.rc-tag-sin{ color:var(--vermilion); }
.rc-readval{ font-family: ui-monospace, monospace; font-variant-numeric:tabular-nums;
  font-size:13px; }

.rc-facts{ margin-top:14px; display:flex; flex-direction:column; gap:8px; }
.rc-fact{ display:flex; justify-content:space-between; align-items:baseline;
  font-size:13px; }
.rc-fact span:first-child{ font-family: Georgia, serif; font-style:italic; color:#c6cedd; }
.rc-fact .rc-mono{ font-size:12.5px; }

/* field notes — the educational cards */
.rc-fieldnotes{ margin-top:16px; display:flex; flex-direction:column; gap:10px; }
.rc-fieldnote{ background:rgba(243,239,228,.06); border-left:2px solid #9aa6bd;
  padding:10px 12px; }
.rc-fn-star{ border-left-color:var(--vermilion); }
.rc-fn-square{ border-left-color:var(--teal); }
.rc-fn-link{ border-left-color:var(--gold); }
.rc-fn-head{ display:flex; align-items:baseline; gap:8px; margin-bottom:5px; }
.rc-fn-tag{ font-family: ui-monospace, monospace; font-size:12px; font-weight:600;
  color:var(--paper); }
.rc-fn-title{ font-family: Georgia, serif; font-style:italic; font-size:13px; color:#c6cedd; }
.rc-fn-text{ margin:0; font-size:12px; line-height:1.5; color:#dfe3ea; }

/* circle ticks + caption */
.rc-tick{ fill:rgba(243,239,228,.7); }
.rc-ticklabel{ fill:#9aa6bd; font-family: ui-monospace, monospace; font-size:9px; }
.rc-circlecap{ margin:10px 2px 0; font-size:11px; line-height:1.45; color:#9aa6bd;
  text-align:center; }

.rc-foot{
  margin-top:20px; padding-top:14px; border-top:1px solid var(--rule);
  font-size:13px; color:#3a4254; font-family: Georgia, serif; font-style:italic;
  display:flex; align-items:center; gap:6px; flex-wrap:wrap;
}
.rc-foot .rc-surd{ font-style:normal; }

@media (max-width:680px){
  .rc-root{ padding:22px 18px; }
  .rc-title{ font-size:36px; }
  .rc-aside{ flex:1 1 100%; }
}
@media (prefers-reduced-motion: reduce){
  .rc-point{ transition:none; }
}
`;
