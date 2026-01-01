const textarea = document.getElementById("equations");
const gridToggle = document.getElementById("gridToggle");
let gridOn = true;

textarea.addEventListener("input", plotLive);
gridToggle.addEventListener("click", () => {
  gridOn = !gridOn;
  plotLive();
});

/* ---------- UNIVERSAL NORMALIZER ---------- */
function normalizeExpression(expr) {
  return expr
    .replace(/\s+/g, "")

    // Unicode powers
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")

    // Square root
    .replace(/√/g, "sqrt")

    // Absolute value |x|
    .replace(/\|([^|]+)\|/g, "abs($1)")

    // Inverse trig (human forms)
    .replace(/sin\^-1|sin⁻¹|arcsin/gi, "asin")
    .replace(/cos\^-1|cos⁻¹|arccos/gi, "acos")
    .replace(/tan\^-1|tan⁻¹|arctan/gi, "atan")

    // Trig without parentheses: sinx → sin(x)
    .replace(/(sin|cos|tan|asin|acos|atan)([a-zA-Z0-9]+)/gi, "$1($2)")

    // Logs
    .replace(/ln/gi, "log")

    // Exponential
    .replace(/e\^/gi, "exp")

    // Implicit multiplication
    .replace(/(\d)([a-zA-Z])/g, "$1*$2")
    .replace(/([a-zA-Z])(\d)/g, "$1*$2")
    .replace(/\)\(/g, ")*(")
    .replace(/([a-zA-Z])\(/g, "$1*(");
}

/* ---------- MAIN PLOT ---------- */
function plotLive() {
  const lines = textarea.value.split("\n");
  const traces = [];

  lines.forEach(line => {
    line = line.trim();
    if (!line) return;

    try {
      // IMPLICIT
      if (line.startsWith("implicit:")) {
        let expr = line.replace("implicit:", "").trim();
        expr = normalizeExpression(expr);

        const xs = [], ys = [], z = [];
        for (let i = -10; i <= 10; i += 0.25) {
          xs.push(i);
          ys.push(i);
        }

        for (let x of xs) {
          const row = [];
          for (let y of ys) {
            row.push(math.evaluate(expr, { x, y }));
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

      // PARAMETRIC
      else if (line.startsWith("parametric:")) {
        const parts = line.replace("parametric:", "").split(",");
        let fx = normalizeExpression(parts[0].split("=")[1]);
        let fy = normalizeExpression(parts[1].split("=")[1]);

        const xs = [], ys = [];
        for (let t = -10; t <= 10; t += 0.05) {
          xs.push(math.evaluate(fx, { t }));
          ys.push(math.evaluate(fy, { t }));
        }

        traces.push({
          x: xs,
          y: ys,
          mode: "lines",
          hovertemplate: "x = %{x:.2f}<br>y = %{y:.2f}<extra></extra>"
        });
      }

      // NORMAL
      else {
        let expr = line.includes("=") ? line.split("=")[1] : line;
        expr = normalizeExpression(expr);

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
          hovertemplate: "x = %{x:.2f}<br>y = %{y:.2f}<extra></extra>"
        });
      }
    } catch {}
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

plotLive();
document.getElementById("year").textContent = new Date().getFullYear();
