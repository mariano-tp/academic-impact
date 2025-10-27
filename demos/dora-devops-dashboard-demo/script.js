const $ = (id) => document.getElementById(id);
const params = ['multiRegion','immutableBackups','chaosPerQuarter','monitoringCoverage','vulnScanning','sbomSigning','cfr','mttr','rtoTarget','rpoTarget','thirdPartyConcentration'];

function setOut(p){
  const el = $(p), out = $(p+'Out');
  if (!el || !out) return;
  if (p==='cfr') out.textContent = el.value + '%';
  else if (p==='mttr' || p==='rtoTarget') out.textContent = el.value + ' h';
  else if (p==='rpoTarget') out.textContent = el.value + ' min';
  else out.textContent = (+el.value).toFixed(2);
}

params.forEach(p => { setOut(p); const el=$(p); el&&el.addEventListener('input', ()=>{ setOut(p); computeAndRender(); }); });

$('presetConservador').addEventListener('click', ()=>{
  $('multiRegion').value=0.8; $('immutableBackups').value=0.8; $('chaosPerQuarter').value=1;
  $('monitoringCoverage').value=0.8; $('vulnScanning').value=0.8; $('sbomSigning').value=0.7;
  $('cfr').value=15; $('mttr').value=4; $('rtoTarget').value=4; $('rpoTarget').value=30; $('thirdPartyConcentration').value=0.3;
  params.forEach(setOut); computeAndRender();
});
$('presetAgresivo').addEventListener('click', ()=>{
  $('multiRegion').value=0.5; $('immutableBackups').value=0.4; $('chaosPerQuarter').value=6;
  $('monitoringCoverage').value=0.6; $('vulnScanning').value=0.9; $('sbomSigning').value=0.9;
  $('cfr').value=25; $('mttr').value=8; $('rtoTarget').value=2; $('rpoTarget').value=10; $('thirdPartyConcentration').value=0.6;
  params.forEach(setOut); computeAndRender();
});
$('exportJson').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(currentSnapshot(), null, 2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'dora_snapshot.json'; a.click(); URL.revokeObjectURL(a.href);
});

function currentSnapshot(){
  const p = {}; params.forEach(k => p[k]=+$(k).value);
  const s = computeScores(p);
  return { params:p, scores:s, generated_at: Date.now()/1000 };
}

function computeScores(p){
  const cfrScore = 100 * Math.max(0, (30 - p.cfr) / 30);
  const mttrScore = 100 * Math.max(0, (24 - p.mttr) / 24);
  const rtoScore = 100 * Math.max(0, 1 - Math.max(0, (p.mttr - p.rtoTarget))/Math.max(1,p.rtoTarget));
  const chaosScore = scaleChaos(p.chaosPerQuarter);

  const riskICT = avg([p.monitoringCoverage*100, p.vulnScanning*100, p.sbomSigning*100, cfrScore, mttrScore]);
  const incidents = avg([mttrScore, p.monitoringCoverage*100, chaosScore, rtoScore]);
  const testing = avg([chaosScore, p.multiRegion*100, p.immutableBackups*100]);
  const thirdParties = avg([(100 - p.thirdPartyConcentration*100), p.sbomSigning*100, p.vulnScanning*100]);
  const infoSharing = avg([p.monitoringCoverage*100, (chaosScore + rtoScore)/2]);

  const overall = avg([riskICT, incidents, testing, thirdParties, infoSharing]);
  return { riskICT, incidents, testing, thirdParties, infoSharing, overall };
}

function scaleChaos(n){
  if (n<=0) return 0; if (n>=12) return 100;
  const map={1:40,2:60,3:70,4:80,5:85,6:88,7:90,8:95,9:96,10:97,11:98};
  return map[Math.round(n)] ?? Math.round(100*(n/12));
}
function avg(a){ return a.reduce((x,y)=>x+y,0)/a.length; }

let radarChart, barsChart;
function computeAndRender(){
  const s = currentSnapshot().scores;
  const radarData = { labels:['Riesgo ICT','Incidentes','Testing','Terceros','Info sharing'], datasets:[{ label:'Score DORA', data:[s.riskICT,s.incidents,s.testing,s.thirdParties,s.infoSharing] }] };
  const barData = { labels:['Global','Riesgo ICT','Incidentes','Testing','Terceros','Info sharing'], datasets:[{ label:'Score', data:[s.overall,s.riskICT,s.incidents,s.testing,s.thirdParties,s.infoSharing] }] };
  if (!radarChart){ radarChart = new Chart(document.getElementById('radar'), { type:'radar', data:radarData, options:{ scales:{ r:{ suggestedMin:0, suggestedMax:100 }}}}); }
  else { radarChart.data = radarData; radarChart.update(); }
  if (!barsChart){ barsChart = new Chart(document.getElementById('bars'), { type:'bar', data:barData, options:{ scales:{ y:{ suggestedMin:0, suggestedMax:100 }}}}); }
  else { barsChart.data = barData; barsChart.update(); }
}
computeAndRender();
