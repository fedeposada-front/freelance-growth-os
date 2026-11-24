const boxes={
  amba:'-34.87,-58.82,-34.40,-58.28',
  caba:'-34.71,-58.54,-34.53,-58.33',
  lamatanza:'-34.86,-58.79,-34.59,-58.51',
  zonaoeste:'-34.77,-58.88,-34.55,-58.56',
  zonanorte:'-34.63,-58.68,-34.34,-58.43',
  zonasur:'-34.93,-58.64,-34.64,-58.28',
  laplata:'-35.04,-58.08,-34.84,-57.79',
  rosario:'-33.07,-60.80,-32.83,-60.54',
  cordoba:'-31.54,-64.33,-31.31,-64.07',
  mendoza:'-33.01,-68.95,-32.80,-68.73',
  mardelplata:'-38.14,-57.67,-37.94,-57.48'
};
const sectors={
  funeral:{tags:['["shop"="funeral_directors"]','["amenity"="funeral_hall"]'],name:'Funerarias'},
  hvac:{tags:['["craft"="hvac"]','["shop"="heating"]'],name:'Climatización'},
  plumbing:{tags:['["craft"="plumber"]'],name:'Plomería'},
  electrician:{tags:['["craft"="electrician"]'],name:'Electricidad'},
  construction:{tags:['["craft"="builder"]'],name:'Construcción'},
  roofing:{tags:['["craft"="roofer"]'],name:'Techos y cubiertas'},
  automotive:{tags:['["shop"="car_repair"]'],name:'Talleres mecánicos'},
  dentistry:{tags:['["amenity"="dentist"]'],name:'Odontología'},
  veterinary:{tags:['["amenity"="veterinary"]'],name:'Veterinarias'},
  accounting:{tags:['["office"="accountant"]'],name:'Estudios contables'},
  legal:{tags:['["office"="lawyer"]'],name:'Estudios jurídicos'},
  realestate:{tags:['["office"="estate_agent"]'],name:'Inmobiliarias'},
  beauty:{tags:['["shop"="hairdresser"]','["shop"="beauty"]'],name:'Peluquerías y belleza'},
  fitness:{tags:['["leisure"="fitness_centre"]'],name:'Gimnasios'},
  restaurant:{tags:['["amenity"="restaurant"]'],name:'Restaurantes'},
  cafe:{tags:['["amenity"="cafe"]'],name:'Cafeterías'},
  bakery:{tags:['["shop"="bakery"]'],name:'Panaderías'},
  hotel:{tags:['["tourism"="hotel"]','["tourism"="guest_house"]'],name:'Hoteles y alojamientos'},
  optics:{tags:['["shop"="optician"]'],name:'Ópticas'},
  fashion:{tags:['["shop"="clothes"]'],name:'Indumentaria'},
  furniture:{tags:['["shop"="furniture"]'],name:'Mueblerías'}
};
function compact(value,max=180){return typeof value==='string'?value.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max):''}
function publicEmail(raw){const value=compact(raw,120);return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value)?value:''}
function https(raw){if(typeof raw!=='string')return '';try{const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password&&u.href.length<=1500?u.href:''}catch{return ''}}
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
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
  const q='[out:json][timeout:25];('+clauses+');out center 60;';
  // Prefer the current Private.coffee endpoint (kumi.systems is the legacy hostname).
  // Four seconds was insufficient for real regional Overpass queries.
  // A bounded fallback keeps the app responsive without fabricating results.
  const endpoints=['https://overpass.private.coffee/api/interpreter','https://overpass-api.de/api/interpreter'];
  let payload=null,usedEndpoint='',lastFailure='sin respuesta';
  for(const endpoint of endpoints){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),12000);
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
      if(!x||!['node','way','relation'].includes(x.type)||!Number.isSafeInteger(x.id)||x.id<=0||!x.tags||typeof x.tags.name!=='string'||!compact(x.tags.name,100))return false;
      const key=x.type+'/'+x.id;
      if(seen.has(key))return false;
      seen.add(key);
      return true;
    }).slice(0,60).map(function(x){
      const t=x.tags||{};
      const city=[t['addr:city'],t['addr:suburb'],t['addr:district']].map(v=>compact(v,80)).find(Boolean)||'';
      const website=https(t.website)||https(t['contact:website']);
      return {name:compact(t.name,100),sector:sector.name,city,website,email:publicEmail(t.email)||publicEmail(t['contact:email']),phone:compact(t.phone,80)||compact(t['contact:phone'],80),osmId:x.type+'/'+x.id,sourceUrl:'https://www.openstreetmap.org/'+x.type+'/'+x.id};
    });
    return res.status(200).json({companies:list,source:'OpenStreetMap · Overpass API',providerUrl:usedEndpoint,at:new Date().toISOString(),license:'ODbL: https://www.openstreetmap.org/copyright',warning:'OSM es una fuente colaborativa; confirmar existencia, web y contacto antes de usar comercialmente.'});
  }catch(e){return res.status(503).json({error:'No se pudo procesar la respuesta de Overpass. Importá CSV o reintentá. No se generaron resultados ficticios.'})}
}
