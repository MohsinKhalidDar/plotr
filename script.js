const textarea = document.getElementById("equations");
const gridToggle = document.getElementById("gridToggle");
const degToggle = document.getElementById("degToggle");
const slidersDiv = document.getElementById("sliders");
const parsedBox = document.getElementById("parsed");

let gridOn = true;
let useDegrees = false;
let params = { a: 1, b: 1, c: 0, k: 1 };

gridToggle.onclick = () => (gridOn = !gridOn, plot());
degToggle.onchange = () => (useDegrees = degToggle.checked, plot());
textarea.addEventListener("input", plot);

/* ---------- SAFE NORMALIZATION ---------- */
function normalize(expr) {
  return expr
    .replace(/\s+/g, "")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/√\(([^)]+)\)/g, "sqrt($1)")
    .replace(/√([a-zA-Z0-9]+)/g, "sqrt($1)")
    .replace(/\|([^|]+)\|/g, "abs($1)")
    .replace(/sin\^-1|sin⁻¹/gi, "asin")
    .replace(/cos\^-1|cos⁻¹/gi, "acos")
    .replace(/tan\^-1|tan⁻¹/gi, "atan")
    .replace(/e\^\(([^)]+)\)/gi, "exp($1)")
    .replace(/e\^([a-zA-Z0-9]+)/gi, "exp($1)")
    .replace(/\bln\b/gi, "log")
    .replace(/(\d)([a-zA-Z])/g, "$1*$2")
    .replace(/\)\(/g, ")*(");
}

/* ---------- DEGREE HANDLING ---------- */
function trig(expr) {
  if (!useDegrees) return expr;
  return expr
    .replace(/sin\(/g, "sin(pi/180*")
    .replace(/cos\(/g, "cos(pi/180*")
    .replace(/tan\(/g, "tan(pi/180*");
}

/* ---------- SLIDERS ---------- */
function buildSliders(expr) {
  slidersDiv.innerHTML = "";
  const vars = [...new Set(expr.match(/[abck]/g) || [])];
  vars.forEach(v => {
    slidersDiv.innerHTML += `
      <div>
        ${v}:
        <input type="range" min="-5" max="5" step="0.1"
        value="${params[v]}"
        oninput="params['${v}']=this.value; plot()">
        ${params[v]}
      </div>`;
  });
}

/* ---------- MAIN PLOT ---------- */
function plot() {
  const lines = textarea.value.split("\n");
  const traces = [];
  parsedBox.textContent = "";

  lines.forEach((line, idx) => {
    line = line.trim();
    if (!line) return;

    try {
      /* PARAMETRIC */
      if (line.startsWith("parametric:")) {
        const p = line.replace("parametric:", "").split(",");
        let fx = trig(normalize(p[0].split("=")[1]));
        let fy = trig(normalize(p[1].split("=")[1]));
        buildSliders(fx + fy);
        parsedBox.textContent += `Line ${idx + 1}: ${fx}, ${fy}\n`;

        const xs = [], ys = [];
        for (let t = -10; t <= 10; t += 0.05) {
          xs.push(math.evaluate(fx, { t, ...params }));
          ys.push(math.evaluate(fy, { t, ...params }));
        }
        traces.push({ x: xs, y: ys, mode: "lines" });
      }

      /* y = f(x) */
      else if (line.startsWith("y")) {
        let expr = trig(normalize(line.split("=")[1]));
        buildSliders(expr);
        parsedBox.textContent += `Line ${idx + 1}: ${expr}\n`;

        const xs = [], ys = [];
        for (let x = -10; x <= 10; x += 0.05) {
          xs.push(x);
          try {
            ys.push(math.evaluate(expr, { x, ...params }));
          } catch {
            ys.push(null);
          }
        }
        traces.push({ x: xs, y: ys, mode: "lines" });
      }

      /* INEQUALITY */
      else if (/[<>]=?/.test(line)) {
        const expr = normalize(line.replace(/[<>]=?/, "-(") + ")");
        parsedBox.textContent += `Line ${idx + 1}: ${expr}\n`;

        const xs = [], ys = [], z = [];
        for (let i = -10; i <= 10; i += 0.3) {
          xs.push(i);
          ys.push(i);
        }

        for (let x of xs) {
          const row = [];
          for (let y

