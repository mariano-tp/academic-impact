// Simplified hash-chain evidence demo with helper buttons
async function sha256(str){const buf=new TextEncoder().encode(str);const hash=await crypto.subtle.digest("SHA-256",buf);return Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,"0")).join("");}
function loadLines(){return JSON.parse(localStorage.getItem("audit_log")||"[]");}
function saveLines(a){localStorage.setItem("audit_log",JSON.stringify(a));}
function ensureGenesis(){let a=loadLines();if(a.length===0)a.push({ts:Date.now()/1000,type:"genesis",prev_hash:null,data:{},hash:""});saveLines(a);}
async function updateHash(){let a=loadLines();for(let i=0;i<a.length;i++){if(!a[i].hash){const src=JSON.stringify({...a[i],hash:null});a[i].hash=await sha256(src);saveLines(a);renderLog();}}}
function lastHash(){const a=loadLines();return a.length?a[a.length-1].hash:null;}
function addEvent(e){let a=loadLines();a.push(e);saveLines(a);updateHash();}
function renderLog(){const a=loadLines();document.getElementById("log-view").textContent=a.map(x=>JSON.stringify(x)).join("\n");const root=document.getElementById("root-hash");const last=a[a.length-1];root.textContent="Cadena root (último hash): "+(last?.hash||"(vacío)");}
document.getElementById("consent-form").onsubmit=(ev)=>{ev.preventDefault();ensureGenesis();addEvent({ts:Date.now()/1000,type:"consent",prev_hash:lastHash(),data:{subject_id:cSub.value,scope:cScope.value,granted:cGranted.value}});};
document.getElementById("ingest-form").onsubmit=(ev)=>{ev.preventDefault();ensureGenesis();let p={};try{p=JSON.parse(iPayload.value);}catch{}addEvent({ts:Date.now()/1000,type:"ingest",prev_hash:lastHash(),data:{actor:iActor.value,resource:iResource.value,payload:p}});};
document.getElementById("btn-clear").onclick=()=>{localStorage.removeItem("audit_log");renderLog();};
document.getElementById("btn-download").onclick=()=>{const blob=new Blob([JSON.stringify(loadLines(),null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="evidence_bundle.json";a.click();URL.revokeObjectURL(a.href);};
function setStatus(m){const e=document.getElementById("helper-status");if(e){e.textContent=m;setTimeout(()=>e.textContent='',3000);}}
function shorten(h){return h?String(h).slice(0,10)+'…':'';}
function renderLogTable(){const tbody=document.getElementById("log-tbody");const lines=loadLines();tbody.innerHTML='';for(const o of lines){const tr=document.createElement('tr');[new Date(o.ts*1000).toLocaleString(),o.type,shorten(o.hash),shorten(o.prev_hash),Object.keys(o.data||{}).join(', ')].forEach(v=>{const td=document.createElement('td');td.textContent=v;td.style.padding='8px';tr.appendChild(td);});tbody.appendChild(tr);}}
function showTable(){document.getElementById("log-table").style.display='block';document.getElementById("log-view").style.display='none';renderLogTable();}
function showJson(){document.getElementById("log-table").style.display='none';document.getElementById("log-view").style.display='block';}
btnViewTable.onclick=showTable;btnViewJson.onclick=showJson;
btnFillExample.onclick=()=>{cSub.value='paciente-001';cScope.value='telemedicina:consulta';cGranted.value='true';iActor.value='service-telehealth';iResource.value='record-001';iPayload.value=JSON.stringify({bp:'120/80',hr:70,notes:'consulta remota'},null,2);setStatus('Campos autollenados');};
btnGenPayload.onclick=()=>{const payload={bp:'120/80',hr:68+Math.floor(Math.random()*8),temp:36.6,notes:'auto'};iPayload.value=JSON.stringify(payload,null,2);setStatus('Payload generado');};
btnRunDemo.onclick=async()=>{ensureGenesis();btnFillExample.click();consentForm.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));setStatus('Consentimiento registrado');await new Promise(r=>setTimeout(r,500));btnGenPayload.click();ingestForm.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));setStatus('Ingesta registrada');await new Promise(r=>setTimeout(r,500));showTable();setStatus('Demo completa');};
ensureGenesis();renderLog();