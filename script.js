const textarea = document.getElementById("equations");
const gridToggle = document.getElementById("gridToggle");

let gridOn = true;

textarea.addEventListener("input", plot);
gridToggle.addEventListener("click", () => {
  gridOn = !gridOn;
  plot();
});

/* =====================================================
   HUMAN → MATH.JS NORMALIZATION
   (Conservative, safe, extensible)
===================================================== */
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

    // absolute value |x|
    .replace(/\|([^|]+)\|/g, "abs($1)")

    // inverse trig aliases
    .replace(/sin\^-1|sin⁻¹|arcsin/gi, "asin")
    .replace(/cos\^-1|cos⁻¹|arccos/gi, "acos")
    .replace(/tan\^-1|tan⁻¹|arctan/gi, "atan")

    // exponential e^x → exp(x)
    .replace(/e\^\(([^)]+)\)/gi, "exp($1)")
    .replace(/e\^([a-zA-Z0-9]+)/gi, "exp($1)")

    // natural log alias
    .replace(/\bln\b/gi, "log")

    // implicit multiplication: 2x → 2*x
    .replace(/(\d)([a-zA-Z])/g, "$1*$2")

    // (x)(y) → (x)*(y)
    .replace(/\)\(/g, ")*(");
}

/* =====================================================
   MAIN PLOTTING LOGIC
===================================================== */
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
      else if (line.startsWith("y")) {
        const expr = normalize(line.split("=")[1]);
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

      /* ---------- IMPLICIT ---------- */
      else if (line.includes("=")) {
        const expr = normalize(line.replace("=", "-(") + ")");
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
      // ignore invalid equations safely
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

/* initial render */
plot();
document.getElementById("year").textContent = new Date().getFullYear();

