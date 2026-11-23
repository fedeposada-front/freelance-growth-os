const boxes={
  amba:'-34.87,-58.82,-34.40,-58.28',
  caba:'-34.71,-58.54,-34.53,-58.33',
  lamatanza:'-34.86,-58.79,-34.59,-58.51'
};
const sectors={
  funeral:{tags:['["shop"="funeral_directors"]','["amenity"="funeral_hall"]'],name:'Funerarias'},
  hvac:{tags:['["craft"="hvac"]','["shop"="heating"]'],name:'Climatización'},
  plumbing:{tags:['["craft"="plumber"]'],name:'Plomería'}
};
function compact(value,max=180){return typeof value==='string'?value.trim().replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,max):''}
function https(raw){if(typeof raw!=='string')return '';try{const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password&&u.href.length<=1500?u.href:''}catch{return ''}}
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  // Expose only public deployment revision for remote QA; never expose environment secrets.
  const revision=typeof process.env.VERCEL_GIT_COMMIT_SHA==='string'&&/^[a-f0-9]{40}$/i.test(process.env.VERCEL_GIT_COMMIT_SHA)?process.env.VERCEL_GIT_COMMIT_SHA:'unknown';
  res.setHeader('X-App-Revision',revision);
  if(req.method!=='GET')return res.status(405).json({error:'Método no permitido'});
  // Reject unknown filters: silently defaulting would mislabel commercial leads.
  const requestedZone=req.query?.zone??'amba';
  const requestedSector=req.query?.sector??'funeral';
  if(typeof requestedZone!=='string'||!Object.hasOwn(boxes,requestedZone)||typeof requestedSector!=='string'||!Object.hasOwn(sectors,requestedSector)){
    return res.status(400).json({error:'Zona o rubro no admitido',allowedZones:Object.keys(boxes),allowedSectors:Object.keys(sectors)});
  }
  const bbox=boxes[requestedZone],sector=sectors[requestedSector];
  const clauses=sector.tags.map(function(t){return 'nwr'+t+'('+bbox+');'}).join('');
  const q='[out:json][timeout:14];('+clauses+');out center 60;';
  // Two public Overpass instances; each attempt is capped at 4s (8s total),
  // avoiding a 17s worst-case wait that can exceed free serverless execution limits.
  // No silent zero-results: every unsuccessful source is reported as unavailable.
  const endpoints=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
  let payload=null,usedEndpoint='',lastFailure='sin respuesta';
  for(const endpoint of endpoints){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),4000);
    try{
      const response=await fetch(endpoint,{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':'FreelanceGrowthOS/0.1 (small public pilot)'},body:new URLSearchParams({data:q})});
      if(!response.ok){lastFailure='HTTP '+response.status;continue}
      const candidate=await response.json();
      if(!candidate||!Array.isArray(candidate.elements)||(typeof candidate.remark==='string'&&candidate.remark.trim())){
        lastFailure='respuesta inválida o error de Overpass';continue;
      }
      payload=candidate;usedEndpoint=endpoint;break;
    }catch(e){lastFailure=e?.name==='AbortError'?'timeout':'error de red o JSON'}
    finally{clearTimeout(timer)}
  }
  if(!payload)return res.status(503).json({error:'Overpass no disponible en los proveedores públicos consultados ('+lastFailure+'). Reintentá o importá CSV; no se generaron prospectos ficticios.'});
  try{
    // Overpass may return an HTTP 200 with an error/remark or a non-Overpass JSON body.
    // Never present such failures as a genuine zero-results search.
    if(!payload||!Array.isArray(payload.elements)||typeof payload.remark==='string'&&payload.remark.trim()){
      return res.status(503).json({error:'Overpass no devolvió un conjunto de resultados válido. Reintentá o importá CSV; no se generaron prospectos ficticios.'});
    }
    // Validate untrusted Overpass JSON before mapping. Keep CPU and memory bounded.
    const elements=payload.elements.slice(0,300);
    const seen=new Set();
    const list=elements.filter(function(x){
      if(!x||!['node','way','relation'].includes(x.type)||!Number.isSafeInteger(x.id)||x.id<=0||!x.tags||typeof x.tags.name!=='string'||!x.tags.name.trim())return false;
      const key=x.type+'/'+x.id;
      if(seen.has(key))return false;
      seen.add(key);
      return true;
    }).slice(0,60).map(function(x){
      const t=x.tags||{};
      const city=compact([t['addr:city'],t['addr:suburb'],t['addr:district']].find(v=>typeof v==='string'&&v.trim())||(requestedZone==='caba'?'CABA':'AMBA'),80);
      const website=https(t.website||t['contact:website']||'');
      return {name:compact(t.name,100),sector:sector.name,city,website,email:compact(t.email||t['contact:email']||'',120),phone:compact(t.phone||t['contact:phone']||'',80),osmId:x.type+'/'+x.id,sourceUrl:'https://www.openstreetmap.org/'+x.type+'/'+x.id};
    });
    return res.status(200).json({companies:list,source:'OpenStreetMap · Overpass API',providerUrl:usedEndpoint,at:new Date().toISOString(),license:'ODbL: https://www.openstreetmap.org/copyright',warning:'OSM es una fuente colaborativa; confirmar existencia, web y contacto antes de usar comercialmente.'});
  }catch(e){return res.status(503).json({error:'No se pudo procesar la respuesta de Overpass. Importá CSV o reintentá. No se generaron resultados ficticios.'})}
}
