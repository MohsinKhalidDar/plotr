const textarea = document.getElementById("equations");
const gridToggle = document.getElementById("gridToggle");

let gridOn = true;

textarea.addEventListener("input", plot);
gridToggle.addEventListener("click", () => {
  gridOn = !gridOn;
  plot();
});

/* ---------------- SAFE NORMALIZATION ---------------- */
/* Minimal, conservative, never breaks valid math.js */
 function normalize(expr) {
  if (!expr) return expr;

  return expr
    // 1. remove spaces
    .replace(/\s+/g, "")

    // 2. unicode powers
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")

    // 3. constants
    .replace(/\bpi\b/gi, "pi")
    .replace(/\be\b/g, "e")

    // 4. absolute value
    .replace(/\|\|([^|]+)\|\|/g, "abs(abs($1))")
    .replace(/\|([^|]+)\|/g, "abs($1)")

    // 5. square root
    .replace(/√\(([^)]+)\)/g, "sqrt($1)")
    .replace(/√([a-zA-Z0-9]+)/g, "sqrt($1)")

    // 6. inverse trig
    .replace(/sin\^-1|sin⁻¹/gi, "asin")
    .replace(/cos\^-1|cos⁻¹/gi, "acos")
    .replace(/tan\^-1|tan⁻¹/gi, "atan")

    // 7. trig power: sin^2(x) → (sin(x))^2
    .replace(/(sin|cos|tan)\^([0-9]+)\(([^)]+)\)/gi, "($1($3))^$2")
    .replace(/(sin|cos|tan)\^([0-9]+)([a-zA-Z])/gi, "($1($3))^$2")

    // 8. exponential
    .replace(/e\^\(([^)]+)\)/gi, "exp($1)")
    .replace(/e\^([a-zA-Z0-9]+)/gi, "exp($1)")

    // 9. ln → log
    .replace(/\bln\b/gi, "log")

    // 10. sinx → sin(x)
    .replace(/\b(sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|log|exp)([a-zA-Z0-9]+)\b/gi, "$1($2)")

    // 11. number-function: 2sinx → 2*sin(x)
    .replace(/(\d)(sin|cos|tan|log|exp)/gi, "$1*$2")

    // 12. number-variable
    .replace(/(\d)([a-zA-Z])/g, "$1*$2")

    // 13. power-variable: x^2y
    .replace(/(\^[0-9]+)([a-zA-Z])/g, "$1*$2")

    // 14. variable-constant
    .replace(/([a-zA-Z])(pi|e)\b/g, "$1*$2")

    // 15. variable-abs: x|x|
    .replace(/([a-zA-Z])abs/g, "$1*abs")

    // 16. variable-parenthesis
    .replace(/([a-zA-Z])\(/g, "$1*(")

    // 17. parenthesis-variable
    .replace(/\)([a-zA-Z])/g, ")*$1")

    // 18. parenthesis-parenthesis
    .replace(/\)\(/g, ")*(");
}


/* ---------------- MAIN PLOT FUNCTION ---------------- */
function plot() {
  const lines = textarea.value.split("\n");
  const traces = [];

  lines.forEach(line => {
    line = line.trim();
    if (!line) return;

    try {
      /* ---------- PARAMETRIC ---------- */
      if (line.startsWith("parametric:")) {
        const parts = line.replace("parametric:", "").split(",");
        if (parts.length < 2) return;

        const fx = normalize(parts[0].split("=")[1]);
        const fy = normalize(parts[1].split("=")[1]);

        const xs = [], ys = [];
        for (let t = -10; t <= 10; t += 0.05) {
          xs.push(math.evaluate(fx, { t }));
          ys.push(math.evaluate(fy, { t }));
        }

        traces.push({
          x: xs,
          y: ys,
          mode: "lines",
          hovertemplate: "x=%{x:.2f}<br>y=%{y:.2f}<extra></extra>"
        });
      }

      /* ---------- y = f(x) ---------- */
      else if (line.includes("=") && line.startsWith("y")) {
        let expr = normalize(line.split("=")[1]);

        const xs = [], ys = [];
        for (let x = -10; x <= 10; x += 0.05) {
          xs.push(x);
          try {
            ys.push(math.evaluate(expr, { x }));
          } catch {
            ys.push(null);
          }
        }

        traces.push({
          x: xs,
          y: ys,
          mode: "lines",
          hovertemplate: "x=%{x:.2f}<br>y=%{y:.2f}<extra></extra>"
        });
      }

      /* ---------- IMPLICIT (x^2 + y^2 = 4) ---------- */
      else if (line.includes("=")) {
        const expr = normalize(
          line.replace("=", "-(") + ")"
        );

        const xs = [], ys = [], z = [];
        for (let i = -10; i <= 10; i += 0.3) {
          xs.push(i);
          ys.push(i);
        }

        for (let x of xs) {
          const row = [];
          for (let y of ys) {
            try {
              row.push(math.evaluate(expr, { x, y }));
            } catch {
              row.push(null);
            }
          }
          z.push(row);
        }

        traces.push({
          x: xs,
          y: ys,
          z,
          type: "contour",
          contours: { coloring: "lines" },
          showscale: false
        });
      }
    } catch {
      // Ignore invalid equations safely
    }
  });

  Plotly.newPlot(
    "graph",
    traces,
    {
      paper_bgcolor: "#0b1020",
      plot_bgcolor: "#0b1020",
      font: { color: "#e5e7eb" },
      hovermode: "closest",
      margin: { t: 20 },
      xaxis: { showgrid: gridOn, showspikes: false },
      yaxis: { showgrid: gridOn, showspikes: false }
    },
    { responsive: true, displaylogo: false }
  );
}

/* Initial render */
plot();
document.getElementById("year").textContent = new Date().getFullYear();

