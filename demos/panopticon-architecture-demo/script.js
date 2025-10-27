const svg = d3.select("#graph");
const width = +svg.attr("width");
const height = +svg.attr("height");

const nodes = [
  { id: "Usuario", group: "user" },
  { id: "App", group: "infra" },
  { id: "API Gateway", group: "infra" },
  { id: "Servicio-A", group: "infra" },
  { id: "Servicio-B", group: "infra" },
  { id: "DB", group: "data" },
  { id: "Monitor", group: "control" },
  { id: "Admin", group: "control" },
  { id: "Dato", group: "data" }
];

let baseLinks = [
  { source: "Usuario", target: "App" },
  { source: "App", target: "API Gateway" },
  { source: "API Gateway", target: "Servicio-A" },
  { source: "API Gateway", target: "Servicio-B" },
  { source: "Servicio-A", target: "DB" },
  { source: "Servicio-B", target: "DB" },
  { source: "Monitor", target: "Servicio-A" },
  { source: "Monitor", target: "Servicio-B" },
  { source: "Admin", target: "DB" },
  { source: "Admin", target: "Servicio-A" },
  { source: "Admin", target: "Servicio-B" },
  { source: "DB", target: "Dato" }
];

const colorByGroup = { user:"#e0f2fe", data:"#fee2e2", control:"#e9d5ff", infra:"#dcfce7" };

let simulation = d3.forceSimulation(nodes)
  .force("link", d3.forceLink(baseLinks).id(d => d.id).distance(120).strength(0.5))
  .force("charge", d3.forceManyBody().strength(-280))
  .force("center", d3.forceCenter(width/2, height/2));

function restart(links) {
  const l = svg.selectAll(".link").data(links, d => (d.source.id||d.source)+"-"+(d.target.id||d.target));
  l.enter().append("line").attr("class","link");
  l.exit().remove();

  const n = svg.selectAll(".node").data(nodes, d => d.id);
  const nEnter = n.enter().append("g").attr("class", d => "node " + d.group)
    .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended));
  nEnter.append("circle").attr("r", 18).style("fill", d => colorByGroup[d.group] || "#fff");
  nEnter.append("text").attr("dy", 4).attr("x", 22).text(d => d.id);
  n.exit().remove();

  simulation.force("link").links(links);
  simulation.on("tick", () => {
    svg.selectAll(".link")
      .attr("x1", d => d.source.x).attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
    svg.selectAll(".node").attr("transform", d => `translate(${d.x},${d.y})`);
  });
  simulation.alpha(0.5).restart();
}

function dragstarted(event, d){ if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
function dragged(event, d){ d.fx = event.x; d.fy = event.y; }
function dragended(event, d){ if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }

restart(baseLinks);

// Parámetros y score
const centralizationEl = document.getElementById("centralization");
const rbacEl = document.getElementById("rbac");
const loggingEl = document.getElementById("logging");
const segmentationEl = document.getElementById("segmentation");
const outs = {
  centralization: document.getElementById("centralizationOut"),
  rbac: document.getElementById("rbacOut"),
  logging: document.getElementById("loggingOut"),
  segmentation: document.getElementById("segmentationOut")
};
Object.keys(outs).forEach(k => outs[k].textContent = (+document.getElementById(k).value).toFixed(2));

[centralizationEl, rbacEl, loggingEl, segmentationEl].forEach(el => {
  el.addEventListener("input", () => {
    outs[el.id].textContent = (+el.value).toFixed(2);
    applyModel();
  });
});

document.getElementById("preset-low").addEventListener("click", () => {
  centralizationEl.value = 0.2; rbacEl.value = 0.8; loggingEl.value = 0.3; segmentationEl.value = 0.8;
  Object.keys(outs).forEach(k => outs[k].textContent = (+document.getElementById(k).value).toFixed(2));
  applyModel();
});
document.getElementById("preset-high").addEventListener("click", () => {
  centralizationEl.value = 0.9; rbacEl.value = 0.2; loggingEl.value = 0.9; segmentationEl.value = 0.1;
  Object.keys(outs).forEach(k => outs[k].textContent = (+document.getElementById(k).value).toFixed(2));
  applyModel();
});

document.getElementById("export").addEventListener("click", () => {
  const snapshot = {
    params: {
      centralization: +centralizationEl.value,
      rbac: +rbacEl.value,
      logging: +loggingEl.value,
      segmentation: +segmentationEl.value
    },
    score: +document.getElementById("score").textContent,
    nodes: nodes.map(n => ({id:n.id, group:n.group, x:n.x, y:n.y})),
    links: baseLinks.map(l => ({source: l.source.id||l.source, target: l.target.id||l.target}))
  };
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "snapshot_panopticon.json";
  a.click();
  URL.revokeObjectURL(a.href);
});

function applyModel() {
  const c = +centralizationEl.value; // más centralización → más vigilancia
  const r = +rbacEl.value;           // más rbac → menos vigilancia
  const l = +loggingEl.value;        // más logging → más vigilancia indirecta
  const s = +segmentationEl.value;   // más segmentación → menos rutas

  // rutas efectivas desde nodos de control hacia el dato
  let routes = 1.0;
  routes = routes * (0.6 + 0.4*(1 - s));   // segmentación quita rutas
  routes = routes * (0.7 + 0.6*c);         // centralización concentra acceso

  // poder de observación (permisos + observabilidad)
  let controlPower = (0.5 + 0.5*l) * (0.9 - 0.8*r);
  controlPower = Math.max(0, controlPower);

  let score = routes * controlPower;
  score = Math.max(0, Math.min(1, score));

  document.getElementById("score").textContent = score.toFixed(2);

  const dataNode = d3.selectAll(".node").filter(d => d.id === "Dato");
  const exposure = 8 * score;
  dataNode.select("circle").style("--exposure", exposure);

  d3.selectAll(".link").style("stroke-opacity", 0.3 + 0.5*(1 - s));
}
applyModel();
