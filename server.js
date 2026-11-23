import http from 'node:http';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {lookup} from 'node:dns/promises';

const PORT = Number(process.env.PORT || 3000);
const COMPANIES = [
  {name:'Rizobacter',sector:'Biosoluciones agrícolas',website:'https://rizobacter.com.ar/',contact:'https://rizobacter.com/ar/contacto-argentina',why:'Comercialización de soluciones técnicas agrícolas'},
  {name:'Spraytec Argentina',sector:'Fertilizantes',website:'https://spraytecargentina.com/',contact:'https://spraytecargentina.com/',why:'Fertilizantes y comunicación técnica a productores'},
  {name:'Summit Agro Argentina',sector:'Agroinsumos',website:'https://summit-agro.com/ar/',contact:'https://summit-agro.com/ar/',why:'Portafolio técnico de soluciones agrícolas'},
  {name:'Syngenta Argentina',sector:'Protección de cultivos y semillas',website:'https://www.syngenta.com.ar/',contact:'https://www.syngenta.com.ar/',why:'Ventas consultivas de productos de cultivo'},
  {name:'BASF Soluciones para la Agricultura',sector:'Soluciones agrícolas',website:'https://agriculture.basf.com/ar/es',contact:'https://agriculture.basf.com/ar/es/legal/contacto',why:'Soluciones técnicas y red de distribuidores'},
  {name:'UPL Argentina',sector:'Protección de cultivos',website:'https://www.uplcorp.com/ar',contact:'https://www.uplcorp.com/ar',why:'Comercialización de insumos y asesoramiento agrícola'},
  {name:'Nidera Semillas',sector:'Semillas y genética',website:'https://niderasemillas.com.ar/',contact:'https://niderasemillas.com.ar/contactanos/',why:'Acompañamiento técnico al productor'}
];
const clean=(x,max=500)=>String(x??'').replace(/[\u0000-\u001f<>]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
const htmlEscape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function safeURL(raw){try{const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password||u.port)return null;if(!/^[a-z0-9.-]+$/i.test(u.hostname)||u.hostname==='localhost'||u.hostname.endsWith('.local'))return null;return u.href;}catch{return null}}
function privateIP(s){return /^(127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fc|fd|fe80)/i.test(s)}
async function research(url){
 if(!safeURL(url))return {status:'No consultado',summary:'URL HTTPS inválida'};
 try{
  const host=new URL(url).hostname;
  const dns=await lookup(host,{all:true});if(!dns.length||dns.some(d=>privateIP(d.address)))return {status:'No permitido',summary:'Destino local o privado'};
  const ac=new AbortController();const timer=setTimeout(()=>ac.abort(),6500);
  try{
   const r=await fetch(url,{signal:ac.signal,redirect:'error',headers:{'User-Agent':'Mozilla/5.0 (compatible; CoMunicarseOS/0.1)'}});
   if(!r.ok||!(r.headers.get('content-type')||'').includes('html'))return {status:'No accesible',summary:'El sitio no respondió con HTML público'};
   const raw=(await r.text()).slice(0,140000);
   const title=clean(raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1],180);
   const desc=clean(raw.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)?.[1],500);
   return {status:'Consultado',title,summary:desc||clean(raw.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' '),800),checkedAt:new Date().toISOString()};
  }finally{clearTimeout(timer)}
 }catch{return {status:'No accesible',summary:'El sitio bloquea la consulta automática; usar enlace oficial para validación manual'};}
}
function rank(c,e){const t=(c.sector+' '+e.summary+' '+c.why).toLowerCase();const matches=['comercial','distribu','ventas','técnic','cultivo','agric','producto','asesor','capacit'].filter(k=>t.includes(k));const score=Math.min(94,58+matches.length*5);return {score,priority:score>=83?'Alta':score>=70?'Media':'Explorar',signals:matches};}
function proposal(c){
 const n=clean(c.name,100),s=clean(c.sector,120);
 return 'CO.MUNICARSE · ALICIA CAMAÑO\nPROPUESTA CORPORATIVA — BORRADOR\n\nEmpresa: '+n+'\nSector: '+s+'\n\nCOMUNICACIÓN COMERCIAL Y GESTIÓN DE CONVERSACIONES CON CLIENTES\n\nCONTEXTO\nEn empresas de '+s+' puede ser valioso ayudar a equipos comerciales y técnicos a transformar su conocimiento en conversaciones claras, relevantes y orientadas al cliente. Esta es una HIPÓTESIS que debe validarse con '+n+'; no conocemos sus necesidades internas.\n\nOBJETIVO\nFortalecer la preparación de visitas, el mensaje de valor, la argumentación y la gestión de objeciones.\n\nMODALIDAD PROPUESTA\nTaller presencial de 4 horas para hasta 25 personas, a confirmar según el diagnóstico.\n\nCONTENIDOS\n1. Preparar la conversación comercial: objetivo, preguntas y contexto.\n2. Comunicar valor: traducir atributos técnicos en beneficios concretos.\n3. Gestionar objeciones: precio, financiación, alternativas y dudas.\n4. Aplicación práctica: simulación de conversaciones, role plays y feedback.\n\nMETODOLOGÍA\nReunión de alineación, contenidos adaptados, ejercicios, material de apoyo, evaluación de satisfacción y seguimiento de aplicación a los 30–45 días.\n\nRESULTADOS ESPERADOS\nMejor preparación de conversaciones, comunicación de valor y manejo de objeciones. Son objetivos, no resultados garantizados.\n\nINVERSIÓN\nA presupuestar después del diagnóstico: no se infiere tarifa vigente del trabajo anterior.\n\nPRÓXIMO PASO\nCoordinar conversación de diagnóstico con la persona responsable de Comercial o Capacitación.\n\nNO ENVIAR SIN REVISIÓN DE ALICIA. La empresa no fue contactada desde este sistema.';
}
function send(res,obj,status=200){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(obj));}
const page=String.raw`<!doctype html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Co.Municarse — Radar Comercial</title><style>
:root{font-family:Arial,system-ui,sans-serif;color:#2a2430;background:#faf6f6}*{box-sizing:border-box}body{margin:0}header{background:#281d28;color:#fff;padding:23px max(22px,calc((100vw - 1150px)/2));display:flex;align-items:center;justify-content:space-between}.brand{font-weight:800;letter-spacing:.13em}.brand span{color:#fc5eac}header small{font-size:12px;color:#d3bac8}main{max-width:1150px;margin:auto;padding:40px 22px}h1{font-size:clamp(34px,5vw,58px);letter-spacing:-.055em;margin:12px 0}h1 span{color:#dd2a81}.eyebrow{color:#ac2268;font-size:11px;letter-spacing:.17em;font-weight:700}.lede{color:#837782;max-width:600px;line-height:1.6;margin-bottom:30px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.panel{border-radius:17px;background:white;border:1px solid #ede3e8;padding:24px;box-shadow:0 9px 23px #5223440b}.step{display:flex;align-items:center;gap:12px;margin:0 0 19px}.step b{color:#c82473;background:#fde8f1;padding:8px;border-radius:8px;font-size:12px}.step h2{font-size:18px;margin:0}label{display:block;margin:13px 0;font-size:12px;font-weight:700;color:#665462}input,select,textarea{display:block;width:100%;border:1px solid #decfd9;border-radius:8px;padding:12px;margin-top:7px;font:inherit;color:#332531;background:#fff;outline:none}input:focus,select:focus,textarea:focus{border-color:#d82d7e;box-shadow:0 0 0 3px #e12b8022}.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}.button{background:#db267d;color:#fff;border:0;padding:14px;border-radius:9px;width:100%;font-weight:700;cursor:pointer}.button:disabled{opacity:.6}button.secondary{border:1px solid #d9cad4;background:white;color:#aa246a;padding:11px 18px;border-radius:8px;cursor:pointer;margin-right:8px}.help{font-size:12px;color:#8b7e89;line-height:1.6}.result{margin-top:16px;padding:18px;background:#fbf7f9;border-radius:10px;border:1px solid #f0e5eb;min-height:150px;font-size:13px;line-height:1.6}.score{font-size:29px;font-weight:800}.pill{color:#b22268;background:#ffe1ef;font-weight:bold;border-radius:20px;padding:5px 9px;font-size:12px;margin-left:8px}.result a{color:#ac256b}textarea{height:550px;font:12px/1.6 ui-monospace,monospace;resize:vertical}.actions{margin-top:10px}.note{background:#faf0f5;border-radius:10px;padding:14px;margin-top:24px;font-size:12px;color:#675563;line-height:1.5}footer{margin-top:30px;font-size:11px;color:#998a94}@media(max-width:800px){.grid,.two{grid-template-columns:1fr}header small{display:none}textarea{height:450px}}
</style></head><body><header><div class="brand"><span>CO.</span>MUNICARSE</div><small>RADAR COMERCIAL · v0.1</small></header><main><div class="eyebrow">CAPTACIÓN CORPORATIVA</div><h1>Investigá empresas.<br><span>Prepará propuestas.</span></h1><p class="lede">Una herramienta simple para explorar empresas, priorizar su afinidad comercial y generar una propuesta editable sin pagar APIs.</p><div class="grid"><section class="panel"><div class="step"><b>01</b><h2>Seleccioná una empresa</h2></div><label>Empresas precargadas<select id="preset"><option value="">Elegí una empresa…</option></select></label><div class="two"><label>Empresa<input id="name" placeholder="Nombre"></label><label>Sector<input id="sector" placeholder="Agroindustria"></label></div><label>Sitio web oficial<input id="website" placeholder="https://empresa.com"></label><label>Motivo de afinidad<input id="why" placeholder="Por qué podría encajar"></label><button class="button" id="go">Investigar y crear propuesta →</button><p id="status" class="help">Información obtenida del sitio indicado si permite el acceso.</p><div class="step" style="margin-top:30px"><b>02</b><h2>Investigación y prioridad</h2></div><div class="result" id="result">Seleccioná una empresa para empezar.</div></section><section class="panel"><div class="step"><b>03</b><h2>Propuesta editable</h2></div><p class="help">Borrador basado en la metodología de capacitación de Yara Argentina. Alicia debe revisar antes de compartirlo.</p><textarea id="proposal" spellcheck="true" placeholder="Tu propuesta aparecerá acá…"></textarea><div class="actions"><button class="secondary" id="copy">Copiar</button><button class="secondary" id="download">Descargar TXT</button></div><div class="note">La prioridad es una estimación de afinidad, no la intención de compra real. No se identifican contactos ni se envían correos. No se guardan datos en el servidor.</div></section></div><footer>Co.Municarse · Alicia Camaño — Piloto interno de investigación comercial.</footer></main><script>
const $=id=>document.getElementById(id);let companies=[];
fetch('/api/companies').then(r=>r.json()).then(rows=>{companies=rows;rows.forEach((c,i)=>{let o=document.createElement('option');o.value=i;o.textContent=c.name;$('preset').append(o)})}).catch(()=>$('status').textContent='No se pudo cargar el catálogo');
$('preset').addEventListener('change',()=>{let c=companies[Number($('preset').value)];if(!c)return;['name','sector','website','why'].forEach(k=>$(k).value=c[k]||'')});
$('go').addEventListener('click',async()=>{const body={name:$('name').value,sector:$('sector').value,website:$('website').value,why:$('why').value};$('go').disabled=true;$('status').textContent='Investigando el sitio oficial…';try{const response=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw Error(data.error);$('result').replaceChildren();const line=document.createElement('div');line.className='score';line.textContent=data.score+'/100';const pill=document.createElement('span');pill.className='pill';pill.textContent='Prioridad '+data.priority;line.append(pill);$('result').append(line);for(const item of [data.why||'', 'Consulta web: '+data.research.status, data.research.summary||'', 'Señales temáticas: '+(data.signals.join(', ')||'sin coincidencias')]){const p=document.createElement('p');p.textContent=item;$('result').append(p)}const a=document.createElement('a');a.href=data.website;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Ver sitio oficial ↗';$('result').append(a);$('proposal').value=data.proposal;$('status').textContent='Listo. Revisá y ajustá la propuesta.'}catch(e){$('status').textContent=e.message}finally{$('go').disabled=false}});
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText($('proposal').value);$('status').textContent='Texto copiado'}catch{$('proposal').select();document.execCommand('copy')}};
$('download').onclick=()=>{let b=new Blob([$('proposal').value],{type:'text/plain;charset=utf-8'});let a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='Comunicarse-'+($('name').value||'propuesta').replace(/[^a-zA-Z0-9-]/g,'-')+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
</script></body></html>`;

const DISCOVERY_POOL=[
{name:'Calister',sector:'Agroquímicos y semillas',website:'https://www.calister.com.uy/',contact:'https://www.calister.com.uy/la-empresa/',why:'Comercialización de productos orientados al sector agropecuario',country:'Uruguay',source:'Sitio oficial · Uruguay'},
{name:'ISUSA',sector:'Fertilizantes y químicos',website:'https://isusa.com.uy/',contact:'https://isusa.com.uy/',why:'Industria química y fertilizantes con comercialización técnica',country:'Uruguay',source:'Sitio oficial · Uruguay'},
{name:'Proquimur',sector:'Agroquímicos',website:'https://proquimur.com.uy/',contact:'https://proquimur.com.uy/',why:'Productos técnicos para agricultura y sector forestal',country:'Uruguay',source:'Sitio oficial · Uruguay'},
{name:'Vettore Uruguay',sector:'Insumos agrícolas',website:'https://www.vettoreuruguay.com/',contact:'https://www.vettoreuruguay.com/',why:'Equipo técnico comercial de asesoramiento al productor',country:'Uruguay',source:'Sitio oficial · Uruguay'},

{name:'Profertil',sector:'Fertilizantes y nutrición de cultivos',website:'https://www.profertil.com.ar/',contact:'https://www.profertil.com.ar/',why:'Producción y comercialización de fertilizantes; comunicación técnica',source:'Catálogo ampliado · web oficial'},
{name:'DONMARIO Semillas',sector:'Genética y semillas',website:'https://www.donmario.com/argentina/',contact:'https://www.donmario.com/argentina/equipo-comercial/',why:'Red comercial y asesoramiento técnico en semillas',source:'Catálogo ampliado · web oficial'},
{name:'Stoller Argentina',sector:'Nutrición y fisiología vegetal',website:'https://www.stoller.com.ar/',contact:'https://materiales.stoller.com.ar/contacto_atc_stollerargentina',why:'Asesores técnicos y soluciones agronómicas',source:'Catálogo ampliado · web oficial'},
{name:'Laboratorios Agroinsumos',sector:'Agroinsumos',website:'https://laboratoriosagroinsumos.com/',contact:'https://laboratoriosagroinsumos.com/contacto/',why:'Productos y asistencia técnica en agroinsumos',source:'Catálogo ampliado · web oficial'}
];
async function discoverCompanies(sector,limit,exclude,country='ambos'){
 const words={agro:['agro','agric','cultivo','semill','fertiliz','food','farm','químic'],industria:['industr','maquin','metal','manufactur','equipam'],tecnologia:['tecnolog','software','internet','telecom','comput','informát'],salud:['salud','médic','farmac','hospital','health'],todos:[]}[sector]||[];
 const out=[];let queryMessage='',querySource='';
 const countryId=country==='uruguay'?'wd:Q77':country==='argentina'?'wd:Q414':'?country';const values=country==='ambos'?'VALUES ?country { wd:Q414 wd:Q77 } ':'';const query='SELECT DISTINCT ?company ?companyLabel ?website ?industryLabel ?country WHERE { '+values+' ?company wdt:P17 '+countryId+' ; wdt:P856 ?website . OPTIONAL { ?company wdt:P452 ?industry . } SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en" . } } LIMIT 250';
 try{
  const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),9500);
  let r;try{r=await fetch('https://query.wikidata.org/sparql?format=json&query='+encodeURIComponent(query),{signal:ctl.signal,headers:{'User-Agent':'CoMunicarseOS/0.2 (public-data discovery; info@comunicarse.com.ar)','Accept':'application/sparql-results+json'},redirect:'error'})}finally{clearTimeout(timer)}
  if(!r.ok)throw new Error('Wikidata HTTP '+r.status);
  const data=await r.json();
  const matches=(data.results?.bindings||[]).map(row=>({name:clean(row.companyLabel?.value,100),sector:clean(row.industryLabel?.value,120)||'Sector por verificar',website:safeURL(row.website?.value),why:'Empresa registrada en fuente abierta; validar afinidad',country:country==='uruguay'||row.country?.value?.endsWith('Q77')?'Uruguay':'Argentina',source:'Wikidata · consulta abierta',sourceUrl:row.company?.value})).filter(c=>c.name&&!/^Q\d+$/.test(c.name)&&c.website&&!exclude.has(c.name.toLowerCase())&&(!words.length||words.some(w=>(c.name+' '+c.sector).toLowerCase().includes(w))));
  for(const c of matches){if(!out.some(x=>x.website===c.website))out.push(c);if(out.length>=limit)break}
  queryMessage='Búsqueda en Wikidata completada.';
  querySource='Wikidata SPARQL';
 }catch(e){queryMessage='La fuente abierta Wikidata no respondió o bloqueó la consulta.';querySource='Wikidata (sin respuesta)'}
 if(out.length<limit && ['agro','todos'].includes(sector)){
  for(const c of DISCOVERY_POOL){if((country==='ambos'||(c.country||'Argentina').toLowerCase()===country)&&!exclude.has(c.name.toLowerCase())&&!out.some(x=>x.name.toLowerCase()===c.name.toLowerCase()))out.push(c);if(out.length>=limit)break}
  if(out.some(c=>c.source?.startsWith('Catálogo')))queryMessage+=' Se completó con empresas adicionales de un catálogo previamente verificado, no con hallazgos en vivo.';
 }
 return {companies:out.slice(0,limit),source:out.some(c=>c.source?.includes('Catálogo'))?querySource+' + catálogo ampliado':querySource,message:queryMessage};
}


async function contactsFromOfficialSite(c){
 const site=safeURL(c.website);if(!site)return {error:'Se requiere una URL HTTPS oficial'};
 const u=new URL(site),origin=u.origin;
 const urls=[site,...['/contacto/','/contactanos/','/contact/','/equipo/','/nosotros/'].map(x=>origin+x)];
 const channels=new Map(),checked=[];
 for(const page of urls){
  try{
   const dns=await lookup(u.hostname,{all:true});if(!dns.length||dns.some(d=>privateIP(d.address)))continue;
   const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),3600);
   let response;try{response=await fetch(page,{redirect:'error',signal:ac.signal,headers:{'User-Agent':'Mozilla/5.0 (compatible; CoMunicarseOS/0.3)'}})}finally{clearTimeout(timer)}
   if(!response.ok||!(response.headers.get('content-type')||'').includes('html'))continue;
   const html=(await response.text()).slice(0,120000);
   checked.push(page);
   const items=[...html.matchAll(/(?:mailto:)?([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi)];
   for(const m of items){const email=m[1].toLowerCase();if(email.length>100||/example|sentry|wix|wordpress|google|facebook|schema|noreply|no-reply|cloudflare/.test(email))continue;
    if(!channels.has(email))channels.set(email,{email,source:page,type:/capacit|rrhh|personas|talento|formaci/i.test(email)?'Posible canal de capacitación / RR. HH.':/ventas|comercial|sales/i.test(email)?'Canal comercial publicado':'Canal general publicado (decisor no confirmado)'});
   }
  }catch{/* Page not accessible: never fabricate contact details. */}
 }
 const found=[...channels.values()];found.sort((x,y)=>(y.type.includes('capacitación')?2:y.type.includes('comercial')?1:0)-(x.type.includes('capacitación')?2:x.type.includes('comercial')?1:0));
 return {role:'Responsable de Capacitación / Desarrollo de Personas; alternativamente Gerencia Comercial',person:null,personVerified:false,channels:found.slice(0,10),sources:checked,contactUrl:origin+'/contacto',warning:found.length?'Direcciones publicadas en páginas oficiales; no equivalen a responsables identificados.':'No apareció un email verificable. Consultar el formulario oficial o buscar el responsable por otros canales.'};
}
function draftCommercialEmail(c,recipient){
 const company=clean(c.name,100),sector=clean(c.sector,100),person=clean(recipient.person,90),to=clean(recipient.email,120);
 const greeting=person?'Hola '+person.split(' ')[0]+', ¿cómo estás?':'Hola, ¿cómo están?';
 const subject='Capacitación en comunicación comercial para '+company;
 const body=greeting+'\n\nSoy Alicia Camaño, directora de Co.Municarse. Diseño capacitaciones prácticas para equipos comerciales y técnicos, enfocadas en comunicar valor, preparar conversaciones con clientes y gestionar objeciones.\n\nConocí la actividad de '+company+' en el sector '+sector+' y me gustaría saber si están evaluando alguna iniciativa de formación para sus equipos. Podemos adaptar el programa a situaciones de su trabajo diario.\n\n¿Tendrías 15 minutos para conversar y explorar si puede servirles?'+(!person?'\n\nSi no sos la persona indicada, ¿podrías derivarme con quien coordina las capacitaciones comerciales?':'')+'\n\nMuchas gracias,\nAlicia Camaño\nCo.Municarse';
 return {to,subject,body,status:'Borrador, no enviado',verification:person?'Nombre proporcionado manualmente: verificar identidad y cargo antes de enviar':'Responsable no identificado; mensaje preparado para canal corporativo'};
}


/* Temporary same-origin HTTP downloads.
   Android Chrome may block blob: downloads triggered after async canvas work.
   PDF bytes live in RAM only, not on disk or database, and expire automatically. */
const PDF_MAX_BYTES=18*1024*1024;
const PDF_MAX_MEMORY=40*1024*1024;
const PDF_TTL_MS=10*60*1000;
const preparedPdfs=new Map();
function prunePdfs(){
 const now=Date.now();
 for(const [id,file] of preparedPdfs){if(file.expires<=now)preparedPdfs.delete(id);}
 let used=0;for(const file of preparedPdfs.values())used+=file.pdf.length;
 while(used>PDF_MAX_MEMORY&&preparedPdfs.size){
   const [id,file]=preparedPdfs.entries().next().value;
   preparedPdfs.delete(id);used-=file.pdf.length;
 }
}
function safeDownloadFilename(value){
 const base=String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^A-Za-z0-9 _.-]/g,'').replace(/\s+/g,'-').slice(0,80);
 return (base&&base.toLowerCase().endsWith('.pdf')?base:base?base+'.pdf':'CoMunicarse-Propuesta.pdf');
}
async function preparePdf(req,res){
 if(!(req.headers['content-type']||'').toLowerCase().startsWith('application/pdf'))return send(res,{error:'Se esperaba un PDF'},415);
 if(Number(req.headers['content-length'])>PDF_MAX_BYTES)return send(res,{error:'PDF demasiado grande'},413);
 const parts=[];let length=0;
 for await(const part of req){
  length+=part.length;
  if(length>PDF_MAX_BYTES)return send(res,{error:'PDF demasiado grande'},413);
  parts.push(part);
 }
 const pdf=Buffer.concat(parts,length);
 if(pdf.length<10000||pdf.subarray(0,5).toString('ascii')!=='%PDF-'||!pdf.subarray(-2048).includes(Buffer.from('%%EOF')))
  return send(res,{error:'El documento PDF está vacío o incompleto'},422);
 prunePdfs();
 const token=randomUUID();
 const filename=safeDownloadFilename(req.headers['x-pdf-filename']);
 preparedPdfs.set(token,{pdf,filename,expires:Date.now()+PDF_TTL_MS});
 prunePdfs();
 return send(res,{downloadUrl:'/api/pdf-download/'+token,filename,expiresInMinutes:10});
}
function downloadPdf(res,token){
 prunePdfs();
 const file=preparedPdfs.get(token);
 if(!file)return send(res,{error:'El PDF expiró. Generá uno nuevo.'},404);
 res.writeHead(200,{
  'Content-Type':'application/pdf',
  'Content-Disposition':'attachment; filename="'+file.filename+'"',
  'Content-Length':file.pdf.length,
  'Cache-Control':'private, no-store, max-age=0',
  'Pragma':'no-cache',
  'X-Content-Type-Options':'nosniff'
 });
 return res.end(file.pdf);
}

const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');
 if(req.method==='POST'&&url.pathname==='/api/pdf-prepare')return await preparePdf(req,res);
 if(req.method==='GET'&&/^\/api\/pdf-download\/[0-9a-f-]{36}$/.test(url.pathname))
   return downloadPdf(res,url.pathname.split('/').pop());
 if(req.method==='GET'&&url.pathname==='/api/health')return send(res,{ok:true,version:'0.7.0'});
 if(req.method==='GET'&&url.pathname==='/api/companies')return send(res,COMPANIES);
 if(req.method==='GET'&&url.pathname==='/api/discover'){
 const sector=clean(url.searchParams.get('sector'),30),limit=Math.min(30,Math.max(1,Number(url.searchParams.get('limit'))||10));
 const exclude=new Set(clean(url.searchParams.get('exclude'),5000).split('|').map(x=>x.toLowerCase()));
 const country=['argentina','uruguay','ambos'].includes(url.searchParams.get('country'))?url.searchParams.get('country'):'ambos';return send(res,await discoverCompanies(sector,limit,exclude,country));
 }
 if(req.method==='GET'&&['/assets/alicia-portada.webp','/assets/alicia-cierre.webp','/assets/alicia-firma-clara.webp'].includes(url.pathname)){const file=url.pathname.split('/').pop();const img=await readFile(new URL('./public/assets/'+file,import.meta.url));res.writeHead(200,{'Content-Type':'image/webp','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'});return res.end(img);}
 if(req.method==='GET'&&['/vendor/html2canvas.min.js','/vendor/jspdf.umd.min.js'].includes(url.pathname)){
   const filename=url.pathname.endsWith('html2canvas.min.js')?'./node_modules/html2canvas/dist/html2canvas.min.js':'./node_modules/jspdf/dist/jspdf.umd.min.js';
   const js=await readFile(new URL(filename,import.meta.url));
   res.writeHead(200,{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'public, max-age=604800, immutable','X-Content-Type-Options':'nosniff'});
   return res.end(js);
 }
 if(req.method==='GET'&&url.pathname==='/'){const page2=await readFile(new URL('./public-v2.html',import.meta.url));res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; font-src 'self' https://fonts.gstatic.com; style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com; object-src 'none'; frame-ancestors 'none'"});return res.end(page2);}
 
 if(req.method==='POST'&&(url.pathname==='/api/contacts'||url.pathname==='/api/email-draft')){
  let input='';for await(const chunk of req){input+=chunk;if(input.length>10000)return send(res,{error:'Solicitud muy grande'},413)}
  let b;try{b=JSON.parse(input)}catch{return send(res,{error:'Formato inválido'},400)}
  const company={name:clean(b.name,100),sector:clean(b.sector,120),website:safeURL(b.website)};
  if(!company.name||!company.website)return send(res,{error:'Nombre y URL HTTPS oficial requeridos'},400);
  if(url.pathname==='/api/contacts')return send(res,await contactsFromOfficialSite(company));
  return send(res,draftCommercialEmail(company,b.recipient||{}));
 }
 if(req.method==='POST'&&url.pathname==='/api/analyze'){let input='';for await(const chunk of req){input+=chunk;if(input.length>12000)return send(res,{error:'Datos demasiado extensos'},413)}
 let b;try{b=JSON.parse(input)}catch{return send(res,{error:'JSON inválido'},400)}
 const name=clean(b.name,100),sector=clean(b.sector,120),website=safeURL(b.website),why=clean(b.why,200);
 if(!name||!website)return send(res,{error:'Ingresá nombre y URL HTTPS oficial'},400);
 const c={name,sector,website,why};const r=await research(website);const assessment=rank(c,r);return send(res,{...c,research:r,...assessment,proposal:proposal(c)});
 }
 return send(res,{error:'No encontrado'},404)
 }catch{return send(res,{error:'Error interno'},500)}
});
server.listen(PORT,'0.0.0.0',()=>console.log('Co.Municarse OS on '+PORT));
