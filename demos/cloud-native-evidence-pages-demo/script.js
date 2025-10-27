// Simple audit log with hash-chain in the browser (LocalStorage).
// crypto.subtle is used for SHA-256.

const LOG_KEY = "audit_log_jsonl_v1";

async function sha256Hex(obj) {
  const enc = new TextEncoder();
  const bytes = enc.encode(JSON.stringify(obj, Object.keys(obj).sort(), 0));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function loadLines() {
  const s = localStorage.getItem(LOG_KEY);
  if (!s) return [];
  return s.trim().split("\n").filter(Boolean).map(l => JSON.parse(l));
}

function saveLines(lines) {
  const s = lines.map(o => JSON.stringify(o)).join("\n") + "\n";
  localStorage.setItem(LOG_KEY, s);
}

async function ensureGenesis() {
  let lines = loadLines();
  if (lines.length === 0) {
    const genesis = { ts: Date.now()/1000, type: "genesis", prev_hash: null, data: {} };
    genesis.hash = await sha256Hex(genesis);
    saveLines([genesis]);
    return [genesis];
  }
  return lines;
}

async function appendEvent(event_type, data) {
  let lines = await ensureGenesis();
  const prev = lines[lines.length - 1];
  const rec = {
    ts: Date.now()/1000,
    type: event_type,
    prev_hash: prev.hash,
    data: data
  };
  rec.hash = await sha256Hex(rec);
  lines.push(rec);
  saveLines(lines);
  return rec;
}

function currentRoot() {
  const lines = loadLines();
  if (lines.length === 0) return null;
  return lines[lines.length - 1].hash;
}

function renderLog() {
  const lines = loadLines();
  const el = document.getElementById("log-view");
  el.textContent = lines.map(o => JSON.stringify(o)).join("\n");
  const root = currentRoot();
  document.getElementById("chain-root").textContent = root ? root : "(vacío)";
}

async function exportEvidence() {
  const lines = loadLines();
  if (lines.length === 0) await ensureGenesis();
  const text = loadLines().map(o => JSON.stringify(o)).join("\n") + "\n";

  const root = currentRoot() || "";
  const manifest = {
    files: {},
    chain_root: root,
    generated_at: Date.now()/1000,
    algorithm: "SHA-256"
  };

  function sha256String(s) {
    const enc = new TextEncoder();
    return crypto.subtle.digest("SHA-256", enc.encode(s)).then(buf => {
      const arr = Array.from(new Uint8Array(buf));
      return arr.map(b => b.toString(16).padStart(2, "0")).join("");
    });
  }

  const logHash = await sha256String(text);
  const rootTxt = root + "\n";
  const rootHash = await sha256String(rootTxt);

  manifest.files["audit_log.jsonl"] = logHash;
  manifest.files["chain_root.txt"] = rootHash;

  const zip = new JSZip();
  zip.file("audit_log.jsonl", text);
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  zip.file("chain_root.txt", rootTxt);
  const blob = await zip.generateAsync({type:"blob"});
  saveAs(blob, "evidence_bundle.zip");
}

async function main() {
  await ensureGenesis();
  renderLog();

  document.getElementById("consent-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const subject_id = document.getElementById("c-subject").value.trim();
    const scope = document.getElementById("c-scope").value.trim();
    const granted = document.getElementById("c-granted").value === "true";
    const rec = await appendEvent("consent", {subject_id, scope, granted});
    document.getElementById("consent-out").textContent = JSON.stringify({status:"ok", record_hash:rec.hash}, null, 2);
    renderLog();
  });

  document.getElementById("ingest-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const actor = document.getElementById("i-actor").value.trim();
    const resource = document.getElementById("i-resource").value.trim();
    let payloadRaw = document.getElementById("i-payload").value.trim();
    let payload = {};
    if (payloadRaw) {
      try { payload = JSON.parse(payloadRaw); } catch { payload = {raw: payloadRaw}; }
    }
    const rec = await appendEvent("ingest", {actor, resource, payload});
    document.getElementById("ingest-out").textContent = JSON.stringify({status:"ok", record_hash:rec.hash}, null, 2);
    renderLog();
  });

  document.getElementById("btn-clear").addEventListener("click", () => {
    localStorage.removeItem(LOG_KEY);
    ensureGenesis().then(renderLog);
  });

  document.getElementById("btn-export").addEventListener("click", exportEvidence);
}

main();
