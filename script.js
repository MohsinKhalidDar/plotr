const textarea = document.getElementById("equations");
const gridToggle = document.getElementById("gridToggle");
let gridOn = true;

textarea.addEventListener("input", plotLive);

gridToggle.addEventListener("click", () => {
  gridOn = !gridOn;
  plotLive();
});

function plotLive() {
  const lines = textarea.value.split("\n");
  const traces = [];

  lines.forEach(line => {
    line = line.trim();
    if (!line) return;

    try {
      if (line.startsWith("implicit:")) {
        const expr = line.replace("implicit:", "").trim();
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

      else if (line.startsWith("parametric:")) {
        const parts = line.replace("parametric:", "").split(",");
        const fx = parts[0].split("=")[1];
        const fy = parts[1].split("=")[1];

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

      else {
        const expr = line.includes("=") ? line.split("=")[1] : line;
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

