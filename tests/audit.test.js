import test from 'node:test';
import assert from 'node:assert/strict';
import {validTarget,findingsFromHtml,readLimited,meta,publicAddress} from '../api/audit.js';
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

test('meta detection supports unquoted attributes and rejects misleading text',()=>{
 const base='<title>Empresa real</title><h1>Inicio</h1><a href="tel:+5411000">Teléfono</a><a href="mailto:info@example.com">Email</a>';
 assert.deepEqual(findingsFromHtml(base+'<meta content=width=device-width name=viewport><meta name=description content=Servicios>'),[]);
 const misleading=findingsFromHtml(base+'<meta data-name="viewport"><meta content="name=description">');
 assert.ok(misleading.some(x=>x.name.includes('Viewport')));
 assert.ok(misleading.some(x=>x.name.includes('descripción')));
});


test('description extraction handles reversed attributes and unquoted values without false matches',()=>{
 assert.equal(meta('<meta content="Servicios funerarios" name="description">','description'),'Servicios funerarios');
 assert.equal(meta('<meta name=description content=Servicios>','description'),'Servicios');
 assert.equal(meta('<meta data-name="description" content="Falso">','description'),'');
 assert.equal(meta('<meta content="name=description" data-name="other">','description'),'');
});


test('SSRF guard rejects private, reserved and documentation IP ranges',()=>{
 for(const ip of ['127.0.0.1','10.2.3.4','172.16.1.1','192.168.1.1','169.254.1.2','100.64.1.2','192.0.2.1','198.51.100.2','203.0.113.8','192.88.99.1','198.18.0.1','224.0.0.1','255.255.255.255','::1','fc00::1','fe80::1','2001:db8::1'])assert.equal(publicAddress(ip),false,ip);
 for(const ip of ['8.8.8.8','1.1.1.1','2606:4700:4700::1111'])assert.equal(publicAddress(ip),true,ip);
});

test('audit URL validation rejects query arrays and non-string inputs',()=>{
  for(const input of [undefined,null,[],['https://example.org'],{},42,true,''])assert.equal(validTarget(input),null);
});


test('heuristic audit ignores fake page markup embedded in scripts, styles and comments',()=>{
  const fake='<script>const example = \'<title>Not a title</title><h1>Fake</h1><meta name="viewport" content="x"><meta name="description" content="x"><a href="tel:123">call</a><a href="mailto:a@b.com">mail</a>\';</script>';
  const comments='<!-- <title>Fake</title><h1>Fake</h1><meta name="viewport"><meta name="description"><a href="tel:123"><a href="mailto:a@b.com"> -->';
  const styles='<style>/* <title>Fake</title><h1>Fake</h1><meta name="viewport"><meta name="description"><a href="tel:123"><a href="mailto:a@b.com"> */</style>';
  const names=findingsFromHtml('<html><head>'+fake+comments+styles+'</head></html>').map(x=>x.name);
  assert.equal(names.length,6);
  assert.ok(names.some(x=>x.includes('Viewport')));
  assert.ok(names.some(x=>x.includes('Título')));
});


test('pinned HTTPS transport cannot fall back to hostname DNS',async()=>{
 const {fetchPinnedHtml}=await import('../api/audit.js');
 await assert.rejects(fetchPinnedHtml(new URL('https://example.com/'),[{address:'127.0.0.1',family:4}],AbortSignal.timeout(1000)),/ECONNREFUSED|abort|timeout|connect/i);
});


test('DNS resolution is bounded and never accepts private or empty results',async()=>{
 const {resolvePublicAddresses}=await import('../api/audit.js');
 assert.equal(await resolvePublicAddresses('example.com',async()=>[{address:'127.0.0.1',family:4}]),null);
 assert.equal(await resolvePublicAddresses('example.com',async()=>[]),null);
 assert.deepEqual(await resolvePublicAddresses('example.com',async()=>[{address:'1.1.1.1',family:4}]),[{address:'1.1.1.1',family:4}]);
 await assert.rejects(resolvePublicAddresses('example.com',()=>new Promise(()=>{}),15),/DNS_TIMEOUT/);
});


test('compressed audit responses cannot be mistaken for uncompressed HTML',async()=>{
 const {isReadableHtmlEncoding}=await import('../api/audit.js');
 for(const value of ['',undefined,'identity',' IDENTITY '])assert.equal(isReadableHtmlEncoding(value),true);
 for(const value of ['gzip','br','deflate','gzip, br'])assert.equal(isReadableHtmlEncoding(value),false);
});
