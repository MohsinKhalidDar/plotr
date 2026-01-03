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
    .replace(/\s+/g, "")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/\bpi\b/gi, "pi")

    .replace(/\|\|([^|]+)\|\|/g, "abs(abs($1))")
    .replace(/\|([^|]+)\|/g, "abs($1)")

    .replace(/√\(([^)]+)\)/g, "sqrt($1)")
    .replace(/√([a-zA-Z0-9]+)/g, "sqrt($1)")

    .replace(/sin\^-1|sin⁻¹/gi, "asin")
    .replace(/cos\^-1|cos⁻¹/gi, "acos")
    .replace(/tan\^-1|tan⁻¹/gi, "atan")

    .replace(/(sin|cos|tan)\^([0-9]+)\(([^)]+)\)/gi, "($1($3))^$2")

    .replace(/e\^\(([^)]+)\)/gi, "exp($1)")
    .replace(/e\^([a-zA-Z0-9]+)/gi, "exp($1)")

    .replace(/\bln\b/gi, "log")

    .replace(/\b(sin|cos|tan|asin|acos|atan|log|exp)([a-zA-Z0-9]+)\b/gi, "$1($2)")

    .replace(/(\d)(sin|cos|tan|log|exp|sqrt|abs)/gi, "$1*$2")
    .replace(/(\d)([a-zA-Z])/g, "$1*$2")
    .replace(/(\^[0-9]+)([a-zA-Z])/g, "$1*$2")
    .replace(/([a-zA-Z])(pi)\b/gi, "$1*$2")
    .replace(/([a-zA-Z])abs/g, "$1*abs")
    .replace(/(\d|x|y)\(/g, "$1*(")
    .replace(/\)([a-zA-Z])/g, ")*$1")
    .replace(/\)\(/g, ")*(")

    // trig aliases
    .replace(/\bcot\b/gi, "1/tan")
    .replace(/\bsec\b/gi, "1/cos")
    .replace(/\bcsc\b/gi, "1/sin");
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
      for (let x = -10; x <= 10; x += 0.03) {
        xs.push(x);
      try {
        const y = math.evaluate(expr, { x });

        
    const hasTan = /(^|[^a-z])tan([^a-z]|$)/i.test(expr);
    const hasCotCsc = /(^|[^a-z])(cot|csc)([^a-z]|$)/i.test(expr);
   

    if (!Number.isFinite(y) || Math.abs(y) > 20 ||
    ) {
      ys.push(null);
    } else {
     ys.push(y);
    }

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

plot(); // safe now because textarea is empty
document.getElementById("year").textContent = new Date().getFullYear();



