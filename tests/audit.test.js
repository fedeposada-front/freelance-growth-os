import test from 'node:test';
import assert from 'node:assert/strict';
import {validTarget,findingsFromHtml,readLimited} from '../api/audit.js';
test('accepts only public-looking HTTPS URLs with no port or embedded credentials',()=>{
  assert.ok(validTarget('https://www.sepeliosmoron.com.ar/'));
  for(const s of ['http://example.org','https://localhost/','https://127.0.0.1/','https://user:pass@example.com/','https://example.org:3000/','file:///etc/passwd'])assert.equal(validTarget(s),null);
});
test('reports missing semantic page features as heuristics, not definitive UX verdicts',()=>{
 const a=findingsFromHtml('<html><head></head><body><p>Hola</p></body></html>');
 assert.ok(a.some(x=>x.name.includes('Viewport')));
 assert.ok(a.some(x=>x.name.includes('Título')));
 const b=findingsFromHtml('<html><head><title>Empresa</title><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="Servicios"></head><body><h1>Hola</h1><a href="tel:+5411111">Llamar</a><a href="mailto:contacto@example.com">Escribir</a></body></html>');
 assert.equal(b.length,0);
});

test('bounded audit reader marks oversized HTML incomplete instead of reporting missing UX features',async()=>{
 const bytes=new TextEncoder().encode('<html><head><title>Test</title></head><body>'+ 'x'.repeat(100)+'</body></html>');
 const response={body:new ReadableStream({start(controller){controller.enqueue(bytes);controller.close();}})};
 const result=await readLimited(response,50);
 assert.equal(result.truncated,true);
 assert.equal(result.html,'');
});
test('bounded audit reader returns complete HTML when below cap',async()=>{
 const html='<html><title>Empresa</title></html>';
 const response={body:new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode(html));controller.close();}})};
 const result=await readLimited(response,350000);
 assert.deepEqual(result,{html,truncated:false});
});

test('bounded reader handles absent body without throwing or fabricating HTML',async()=>{
 const result=await readLimited({body:null});
 assert.deepEqual(result,{html:'',truncated:false});
});
test('bounded reader handles an empty stream without fabricated findings',async()=>{
 const response={body:new ReadableStream({start(controller){controller.close();}})};
 const result=await readLimited(response);
 assert.deepEqual(result,{html:'',truncated:false});
});


test('meta checks accept attributes in any order and avoid false findings',()=>{
  const html='<html><head><title>Empresa real</title><meta content="width=device-width" name="viewport"><meta content="Servicios" name="description"></head><body><h1>Inicio</h1><a href="tel:+5411000">Teléfono</a><a href="mailto:info@example.com">Email</a></body></html>';
  assert.deepEqual(findingsFromHtml(html),[]);
});
