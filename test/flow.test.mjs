import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';

const html=await readFile(new URL('../public-v2.html',import.meta.url),'utf8');
const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).at(-1);
const companies=[
 {name:'Summit Agro Argentina',sector:'Agroinsumos',website:'https://summit-agro.com/ar/',why:'Portafolio técnico'},
 {name:'Nidera Semillas',sector:'Semillas y genética',website:'https://niderasemillas.com.ar/',why:'Información técnica al productor'},
 {name:'Empresa Demo B2B',sector:'Industria',website:'https://example.org/',why:'Capacitación comercial'}
];
const pause=()=>new Promise(r=>setTimeout(r,30));
function setup(){
 const dom=new JSDOM(html,{url:'https://comunicarse-os-fede.onrender.com/',runScripts:'outside-only',pretendToBeVisual:true});
 const win=dom.window, doc=win.document, errors=[];
 win.scrollTo=()=>{};win.alert=(x)=>errors.push('alert:'+x);win.confirm=()=>true;
 win.fetch=async (url,opts={})=>{
  const p=String(url);
  const json=p.startsWith('/api/companies')?companies:
   p.startsWith('/api/analyze')?{...JSON.parse(opts.body),research:{status:'Consultado',summary:'Empresa dedicada a productos técnicos para productores y distribuidores'},score:81,priority:'Media',signals:['técnic','comercial']}:
   p.startsWith('/api/contacts')?{role:'Responsable de Capacitación',channels:[],sources:[],warning:'Contacto no verificado'}:
   p.startsWith('/api/email-draft')?{to:'',subject:'Capacitación comercial',body:'Hola, soy Alicia',verification:'Responsable no verificado'}:
   p.startsWith('/api/discover')?{companies:[],message:'Sin nuevas empresas',source:'Prueba'}:{};
  return {ok:true,json:async()=>json};
 };
 win.addEventListener('error',e=>errors.push(e.message));
 win.eval(script);
 return {win,doc,errors};
}
for(const [index,c] of companies.entries()){
 test('recorrido completo · '+c.name,async()=>{
   const {win,doc,errors}=setup();const $=id=>doc.getElementById(id);
   try{
    await pause();
    assert.equal(doc.querySelectorAll('.company').length,3,'carga catálogo');
    doc.querySelectorAll('.company')[index].click();
    assert.equal($('next1').disabled,false,'empresa seleccionada');
    $('next1').click();assert.equal($('step2').classList.contains('hidden'),false,'accede investigación');
    $('analyze').click();await pause();
    assert.equal($('next2').disabled,false,'análisis completado');
    $('next2').click();await pause();
    assert.equal($('step3').classList.contains('hidden'),false,'abre contacto');
    assert.ok($('email-body').value.includes('Alicia'),'email generado');
    $('next3').click();await pause();
    assert.equal($('step4').classList.contains('hidden'),false,'se abre propuesta visual');
    const slides=doc.querySelectorAll('#proposal-preview .proposal-page');
    assert.equal(slides.length,7,'siete páginas');
    assert.ok(slides[0].textContent.includes(c.name),'portada personalizada');
    assert.ok(slides[slides.length-1].textContent.includes(c.name),'cierre personalizado');
    assert.ok(doc.querySelector('img.cover-photo'),'foto portada fija');
    assert.ok(doc.querySelector('img.closing-photo'),'foto cierre fija');
    assert.ok(doc.querySelector('img.signature-art'),'firma fija');
    const description=$('proposal-preview').querySelector('.cover-description');
    description.textContent='Capacitación adaptada y editada para '+c.name;
    const payload=win.eval('buildServerPdfPayload()');
    assert.equal(payload.slides.length,7,'el PDF recibe las siete diapositivas');
    assert.equal(payload.slides[0].data.description,'Capacitación adaptada y editada para '+c.name,'edición de portada llega al PDF servidor');
    assert.equal(payload.company,c.name,'empresa correcta');

    assert.deepEqual(errors,[],'sin errores JS');
   }finally{win.close()}
 });
}