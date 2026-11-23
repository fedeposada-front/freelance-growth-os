import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {PDFDocument} from 'pdf-lib';
import {setTimeout as sleep} from 'node:timers/promises';

const port=40000+Math.floor(Math.random()*14000),base='http://127.0.0.1:'+port;
const app=spawn(process.execPath,['server.js'],{cwd:process.cwd(),env:{...process.env,PORT:String(port)},stdio:'ignore'});
async function startup(){
 for(let i=0;i<60;i++){
  if(app.exitCode!==null)throw Error('Server exited');
  try{if((await fetch(base+'/api/health')).ok)return}catch{}
  await sleep(170);
 }
 throw Error('Server did not start');
}
await startup();
test.after(()=>app.kill());
function sample(company,edited=false){
 return {company,slides:[
 {kicker:'PROPUESTA CORPORATIVA · CO.MUNICARSE',titleLines:['COMUNICACIÓN','QUE GENERA IMPACTO.'],data:{client:company,description:edited?'Texto personalizado y editado para '+company:'Entrenamiento en comunicación comercial.',meta:['Presencial','4 horas','Hasta 25 participantes']}},
 {kicker:'01 · OPORTUNIDAD',titleLines:['ENTENDER EL CONTEXTO.','COMUNICAR VALOR.'],data:{leftLabel:'PUNTO DE PARTIDA',lead:company,sector:'Sector: Agroinsumos',context:'En empresas con conocimiento técnico puede ser valioso comunicar beneficios y mejorar las conversaciones con clientes.',caveat:'Hipótesis de capacitación no confirmada.',rightLabel:'OBJETIVO DEL ENTRENAMIENTO',panelLead:'Preparar conversaciones que conecten conocimiento técnico y las necesidades del cliente.',panelBody:'Fortalecer comunicación, argumentación de valor y la gestión de preguntas.',source:'Referencia pública para validar'}},
 {kicker:'02 · PROGRAMA',titleLines:['CUATRO EJES.','UNA EXPERIENCIA APLICADA.'],data:{programs:[
 {title:'Preparar la conversación',body:'Planificación de visitas y objetivos comerciales.'},
 {title:'Comunicar valor',body:'Atributos técnicos y beneficios relevantes para clientes.'},
 {title:'Gestionar objeciones',body:'Practicar situaciones de precio y alternativas.'},
 {title:'Aplicación práctica',body:'Role plays, feedback y escenarios reales.'}
 ],note:'Programa sujeto a diagnóstico.'}},
 {kicker:'03 · EXPERIENCIA',titleLines:['APRENDER','HACIENDO.'],data:{specs:[{label:'MODALIDAD',value:'Presencial'},{label:'DURACIÓN',value:'4 horas'},{label:'PARTICIPANTES',value:'Hasta 25'}],phases:[
 {title:'Antes',body:'Diagnóstico de necesidades y preparación.'},
 {title:'Durante',body:'Ejercicios prácticos, casos y feedback.'},
 {title:'Después',body:'Transferencia de herramientas al trabajo diario.'}
 ],note:'Fecha y lugar a confirmar.'}},
 {kicker:'04 · SEGUIMIENTO',titleLines:['DEL TALLER','AL DÍA A DÍA.'],data:{leftLabel:'EL EQUIPO SE LLEVA',rightLabel:'CÓMO EVALUAMOS',bullets:[
 'Guías para preparar reuniones y visitas comerciales.','Recursos para traducir conocimiento técnico en valor.','Herramientas para gestionar objeciones.','Práctica y feedback con casos reales.'
 ],evaluations:[{title:'01 · Satisfacción',body:'Encuesta inmediata de utilidad.'},{title:'02 · Aplicación',body:'Seguimiento a 30–45 días, sujeto a alcance.'}],note:'Resultados no garantizados.'}},
 {kicker:'05 · INVERSIÓN',titleLines:['UNA PROPUESTA','A MEDIDA.'],data:{priceLabel:'INVERSIÓN PROPUESTA',price:'A definir tras diagnóstico',priceNote:'El presupuesto final depende de modalidad y alcance.',includesLabel:'ALCANCE SUGERIDO',includes:['Reunión inicial de alineación.','Diseño de contenidos.','Facilitación del taller.','Materiales de apoyo.','Evaluación y seguimiento.'],nextLabel:'SIGUIENTE PASO',nextText:'Una conversación breve para ajustar esta propuesta a '+company+'.',note:'Impuestos y traslados: pendientes.'}},
 {kicker:'ALICIA CAMAÑO · FUNDADORA',titleLines:['UNA VOZ.','MUCHAS POSIBILIDADES.'],data:{intro:'Comunicar mejor es conectar ideas, personas y decisiones.',body:'Co.Municarse combina comunicación estratégica, oratoria y entrenamiento de equipos.',cta:'Conversemos sobre el próximo desafío de '+company+'.',contact:'somoscomunicarse@gmail.com · @co.municarse'}}
 ]};
}
test('Render creates real vector PDF A4 landscape with 7 editable-data slides for multiple companies',async()=>{
 for(const company of ['Nidera Semillas','Summit Agro Argentina','Empresa B2B genérica']){
  const r=await fetch(base+'/api/pdf-render',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(sample(company,true))});
  const body=await r.json();
  assert.equal(r.status,200,JSON.stringify(body));
  assert.equal(body.engine,'server-vector');assert.equal(body.pages,7);
  assert.match(body.downloadUrl,/^\/api\/pdf-download\/[0-9a-f-]{36}$/);
  const get=await fetch(base+body.downloadUrl);
  assert.equal(get.status,200);
  assert.equal(get.headers.get('content-type'),'application/pdf');
  assert.match(get.headers.get('content-disposition'),/attachment;/);
  const pdfbytes=Buffer.from(await get.arrayBuffer());
  assert.equal(pdfbytes.subarray(0,5).toString(),'%PDF-');
  assert.ok(pdfbytes.length>15000);
  const parsed=await PDFDocument.load(pdfbytes);
  assert.equal(parsed.getPageCount(),7);
  for(const pg of parsed.getPages()){
   assert.ok(Math.abs(pg.getWidth()-841.89)<1,'A4 width');
   assert.ok(Math.abs(pg.getHeight()-595.28)<1,'A4 height');
  }
 }
});
test('Malformed submissions are rejected without crashing the service',async()=>{
 const bad=await fetch(base+'/api/pdf-render',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({company:'X',slides:[]})});
 assert.equal(bad.status,422);
 const wrong=await fetch(base+'/api/pdf-render',{method:'POST',headers:{'Content-Type':'text/plain'},body:'garbage'});
 assert.equal(wrong.status,415);
 const health=await fetch(base+'/api/health');assert.equal(health.status,200);
});