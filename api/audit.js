import dns from 'node:dns/promises';
import {isIP} from 'node:net';

function publicAddress(address){
  if(!address || !isIP(address))return false;
  const a=address.toLowerCase();
  if(isIP(a)===4){
    const n=a.split('.').map(Number);
    if(n[0]===0||n[0]===10||n[0]===127||n[0]>=224||n[0]===169&&n[1]===254||n[0]===192&&n[1]===168||n[0]===172&&n[1]>=16&&n[1]<=31||n[0]===100&&n[1]>=64&&n[1]<=127||n[0]===198&&(n[1]===18||n[1]===19)||n[0]===192&&n[1]===0)return false;
    return true;
  }
  return !(a==='::'||a==='::1'||a.startsWith('fe80:')||a.startsWith('fc')||a.startsWith('fd')||a.startsWith('ff')||a.startsWith('::ffff:')||a.startsWith('2001:db8:'));
}
export function validTarget(value){
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
    const match=tag.match(/\sname\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    return (match?.[1]??match?.[2]??match?.[3]??'').toLowerCase()===name;
  });
}
export function findingsFromHtml(html){
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
function meta(html,name){const tags=html.match(/<meta\b[^>]*>/gi)||[];const tag=tags.find(t=>new RegExp('name\\s*=\\s*["\\x27]'+name+'["\\x27]','i').test(t));return decode(tag?.match(/content\s*=\s*["']([^"']*)["']/i)?.[1]||'');}
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
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET')return res.status(405).json({error:'Método no permitido'});
  const u=validTarget(req.query.url);
  if(!u)return res.status(400).json({error:'Se requiere una URL HTTPS pública válida sin puerto especial'});
  const checkedAt=new Date().toISOString();
  try{
    const addresses=await dns.lookup(u.hostname,{all:true,verbatim:true});
    if(!addresses.length||addresses.some(a=>!publicAddress(a.address)))return res.status(400).json({error:'El destino no cumple la política de seguridad pública'});
    const ac=new AbortController(), timer=setTimeout(()=>ac.abort(),7000);
    try{
      const response=await fetch(u.href,{method:'GET',redirect:'manual',signal:ac.signal,headers:{'User-Agent':'Mozilla/5.0 (compatible; FreelanceGrowthOS/0.1; audit)','Accept':'text/html'}});
      if(response.status>=300&&response.status<400)return res.status(200).json({status:'no_consultado',message:'La web redirige. Por seguridad no seguimos redirecciones: ingresá la URL final verificada.',checkedAt,url:u.href});
      if(!response.ok)return res.status(200).json({status:'no_consultado',message:'El sitio respondió HTTP '+response.status+'; no se interpretan problemas UX.',checkedAt,url:u.href});
      const type=response.headers.get('content-type')||'';
      if(!type.includes('text/html'))return res.status(200).json({status:'no_consultado',message:'La respuesta no es HTML accesible.',checkedAt,url:u.href});
      const {html,truncated}=await readLimited(response);
      if(truncated)return res.status(200).json({status:'no_consultado',message:'El HTML supera el límite de análisis (350 KB). No se atribuyen defectos a una respuesta incompleta.',checkedAt,url:u.href});
      if(!html.trim())return res.status(200).json({status:'no_consultado',message:'La respuesta HTML está vacía; no se atribuyen defectos UX.',checkedAt,url:u.href});
      const title=decode(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'');
      const description=meta(html,'description');
      return res.status(200).json({status:'consultado',title,description,checkedAt,url:u.href,findings:findingsFromHtml(html),method:'HTML estático inicial · prueba heurística limitada',source:'Respuesta pública del sitio indicado'});
    }finally{clearTimeout(timer);}
  }catch(e){
    return res.status(200).json({status:'no_consultado',checkedAt,url:u.href,message:'El sitio no permitió completar la consulta pública. No inferimos defectos. '+(e.name==='AbortError'?'Tiempo de espera agotado.':'Requiere verificación manual.')});
  }
}
