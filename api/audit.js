import dns from 'node:dns/promises';
import {isIP} from 'node:net';
import https from 'node:https';
import {Readable} from 'node:stream';

export function publicAddress(address){
  if(!address || !isIP(address))return false;
  const a=address.toLowerCase();
  if(isIP(a)===4){
    const n=a.split('.').map(Number);
    if(n[0]===0||n[0]===10||n[0]===127||n[0]>=224||n[0]===169&&n[1]===254||n[0]===192&&n[1]===168||n[0]===172&&n[1]>=16&&n[1]<=31||n[0]===100&&n[1]>=64&&n[1]<=127||n[0]===198&&(n[1]===18||n[1]===19)||n[0]===192&&(n[1]===0||n[1]===88&&n[2]===99)||n[0]===192&&n[1]===0&&n[2]===2||n[0]===198&&n[1]===51&&n[2]===100||n[0]===203&&n[1]===0&&n[2]===113)return false;
    return true;
  }
  return !(a==='::'||a==='::1'||a.startsWith('fe80:')||a.startsWith('fc')||a.startsWith('fd')||a.startsWith('ff')||a.startsWith('::ffff:')||a.startsWith('2001:db8:'));
}
export function validTarget(value){
  if(typeof value!=='string'||!value.trim())return null;
  try{
    const u=new URL(value);
    if(u.protocol!=='https:'||u.username||u.password||u.port||!u.hostname.includes('.')||u.hostname.length>180||u.href.length>1500)return null;
    if(isIP(u.hostname)||/\.local$|\.internal$|\.localhost$|\.test$/i.test(u.hostname))return null;
    return u;
  }catch{return null;}
}
function hasMetaName(html,name){
  const tags=html.match(/<meta\b[^>]*>/gi)||[];
  return tags.some(tag=>{
    const attrs=tag.slice(5,-1);
    const pairs=attrs.matchAll(/([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g);
    for(const pair of pairs){
      if(pair[1].toLowerCase()==='name'&&(pair[2]??pair[3]??pair[4]??'').toLowerCase()===name)return true;
    }
    return false;
  });
}
export function findingsFromHtml(html){
  // Inline scripts, styles and comments are not visible page structure.
  // Their example markup must not count as actual SEO/contact elements.
  const visibleMarkup=html.replace(/<!--[\s\S]*?-->/g,'').replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi,'');
  html=visibleMarkup;
  const checks=[];
  if(!hasMetaName(html,'viewport'))checks.push({name:'Viewport móvil no detectado',severity:'high',evidence:'No se encontró meta viewport en el HTML descargado. Revisar experiencia responsive manualmente.'});
  if(!/<title\b[^>]*>[^<]{3,}<\/title>/i.test(html))checks.push({name:'Título de página no identificado',severity:'high',evidence:'No se encontró un elemento <title> con contenido legible.'});
  if(!hasMetaName(html,'description'))checks.push({name:'Meta descripción no detectada',severity:'medium',evidence:'La respuesta HTML no incluye una etiqueta meta description reconocible. No implica automáticamente mala indexación.'});
  if(!/<h1\b/i.test(html))checks.push({name:'Encabezado H1 no detectado',severity:'medium',evidence:'No se encontró H1 en el HTML inicial. Podría generarse dinámicamente.'});
  if(!/href\s*=\s*["']tel:/i.test(html))checks.push({name:'Enlace telefónico no detectado',severity:'medium',evidence:'No se observó href="tel:" en el HTML inicial. Revisar si existe otro canal de contacto.'});
  if(!/wa\.me\/|api\.whatsapp\.com|href\s*=\s*["']mailto:/i.test(html))checks.push({name:'Enlace a mensajería/email no detectado',severity:'medium',evidence:'No se observó enlace a WhatsApp o mailto en el HTML inicial. No demuestra ausencia de formulario u otros canales.'});
  return checks;
}
function decode(s){return String(s||'').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/&nbsp;/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,500);}
export function meta(html,name){
  const tags=html.match(/<meta\b[^>]*>/gi)||[];
  for(const tag of tags){
    const attrs={};
    for(const pair of tag.slice(5,-1).matchAll(/([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)){
      attrs[pair[1].toLowerCase()]=pair[2]??pair[3]??pair[4]??'';
    }
    if((attrs.name||'').toLowerCase()===name)return decode(attrs.content||'');
  }
  return '';
}
export async function readLimited(response,max=350000){
  const reader=response.body?.getReader();if(!reader)return {html:'',truncated:false};
  const decoder=new TextDecoder();let text='',count=0;
  while(true){
    const {done,value}=await reader.read();
    if(done)return {html:text+decoder.decode(),truncated:false};
    count+=value.length;
    if(count>max){await reader.cancel();return {html:'',truncated:true};}
    text+=decoder.decode(value,{stream:true});
  }
}
// Pin the TLS connection to an already validated public DNS address.
// Certificate verification and SNI still use the requested hostname.
export function fetchPinnedHtml(url, addresses, signal){
  return new Promise((resolve,reject)=>{
    const address=addresses[0];
    const request=https.request(url,{
      method:'GET',signal,agent:false,servername:url.hostname,
      lookup:(_host,options,callback)=>{
        // Node may request all addresses when autoSelectFamily is enabled.
        // Never delegate to system DNS: return only the prevalidated pinned IP.
        if(options.all)callback(null,[{address:address.address,family:address.family}]);
        else callback(null,address.address,address.family);
      },
      headers:{'User-Agent':'Mozilla/5.0 (compatible; FreelanceGrowthOS/0.1; audit)','Accept':'text/html'}
    },response=>resolve({status:response.statusCode,ok:response.statusCode>=200&&response.statusCode<300,
      headers:{get:name=>response.headers[name.toLowerCase()]||''},body:Readable.toWeb(response)}));
    request.on('error',reject);
    request.end();
  });
}
// Bound DNS latency separately: a stalled resolver must not hold the serverless request indefinitely.
export async function resolvePublicAddresses(hostname, lookup=dns.lookup, timeoutMs=3000){
  let timer;
  try{
    const addresses=await Promise.race([
      Promise.resolve().then(()=>lookup(hostname,{all:true,verbatim:true})),
      new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('DNS_TIMEOUT')),timeoutMs);})
    ]);
    if(!Array.isArray(addresses)||!addresses.length||addresses.some(a=>!a||!publicAddress(a.address)))return null;
    return addresses;
  }finally{clearTimeout(timer);}
}
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET')return res.status(405).json({error:'Método no permitido'});
  const u=validTarget(req.query.url);
  if(!u)return res.status(400).json({error:'Se requiere una URL HTTPS pública válida sin puerto especial'});
  const checkedAt=new Date().toISOString();
  const startedAt=performance.now();
  try{
    const addresses=await resolvePublicAddresses(u.hostname);
    if(!addresses)return res.status(400).json({error:'El destino no cumple la política de seguridad pública'});
    const ac=new AbortController(), timer=setTimeout(()=>ac.abort(),7000);
    try{
      const response=await fetchPinnedHtml(u,addresses,ac.signal);
      if(response.status>=300&&response.status<400)return res.status(200).json({status:'no_consultado',message:'La web redirige. Por seguridad no seguimos redirecciones: ingresá la URL final verificada.',checkedAt,url:u.href});
      if(!response.ok)return res.status(200).json({status:'no_consultado',message:'El sitio respondió HTTP '+response.status+'; no se interpretan problemas UX.',checkedAt,url:u.href});
      // The pinned transport returns raw bytes: compressed HTML must not be parsed as text.
      // Report an unverified audit rather than manufacturing missing-page findings.
      const encoding=(response.headers.get('content-encoding')||'').trim().toLowerCase();
      if(encoding && encoding!=='identity')return res.status(200).json({status:'no_consultado',message:'El servidor respondió HTML comprimido; esta versión del auditor no lo descomprime y no atribuye defectos UX.',checkedAt,url:u.href});
      const type=response.headers.get('content-type')||'';
      if(!type.toLowerCase().includes('text/html'))return res.status(200).json({status:'no_consultado',message:'La respuesta no es HTML accesible.',checkedAt,url:u.href});
      const {html,truncated}=await readLimited(response);
      if(truncated)return res.status(200).json({status:'no_consultado',message:'El HTML supera el límite de análisis (350 KB). No se atribuyen defectos a una respuesta incompleta.',checkedAt,url:u.href});
      if(!html.trim())return res.status(200).json({status:'no_consultado',message:'La respuesta HTML está vacía; no se atribuyen defectos UX.',checkedAt,url:u.href});
      const title=decode(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'');
      const description=meta(html,'description');
      return res.status(200).json({status:'consultado',title,description,checkedAt,url:u.href,httpStatus:response.status,elapsedMs:Math.round(performance.now()-startedAt),htmlBytes:new TextEncoder().encode(html).byteLength,findings:findingsFromHtml(html),method:'HTML estático inicial · prueba heurística limitada',source:'Respuesta pública del sitio indicado'});
    }finally{clearTimeout(timer);}
  }catch(e){
    return res.status(200).json({status:'no_consultado',checkedAt,url:u.href,message:'El sitio no permitió completar la consulta pública. No inferimos defectos. '+(e.name==='AbortError'?'Tiempo de espera agotado.':'Requiere verificación manual.')});
  }
}
