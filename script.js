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
    // remove spaces
    .replace(/\s+/g, "")

    // unicode powers
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")

    // square root
    .replace(/√\(([^)]+)\)/g, "sqrt($1)")
    .replace(/√([a-zA-Z0-9]+)/g, "sqrt($1)")

    // absolute value
    .replace(/\|([^|]+)\|/g, "abs($1)")

    // inverse trig (human form)
    .replace(/sin\^-1|sin⁻¹/gi, "asin")
    .replace(/cos\^-1|cos⁻¹/gi, "acos")
    .replace(/tan\^-1|tan⁻¹/gi, "atan")

    // e^(...) → exp(...)
    .replace(/e\^\(([^)]+)\)/gi, "exp($1)")

    // e^x → exp(x)
    .replace(/e\^([a-zA-Z0-9]+)/gi, "exp($1)")

    // implicit multiplication: 2x → 2*x
    .replace(/(\d)([a-zA-Z])/g, "$1*$2");
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

