import test from 'node:test';
import assert from 'node:assert/strict';
import {validTarget,findingsFromHtml} from '../api/audit.js';
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
