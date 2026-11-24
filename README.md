# Freelance Growth OS · MVP experimental

Repositorio personal independiente de GPT, Co.Municarse y WEBINOW. Rama: mvp/freelance-growth-os.

## Primer vertical slice disponible en código
Radar con búsqueda por OSM/Overpass, CSV, importación/exportación JSON y deduplicación por nombre/localidad. Ficha y pipeline CRM con etapas y scoring reproducible. Auditoría HTML de URL HTTPS con señales de título, metadatos, H1 y enlaces de contacto; guarda evidencia, fuente y fecha. Propuesta visual sectorial conceptual editable, correo borrador y exportación PDF desde imprimir. Todo funciona en modo sin IA y sin envíos automáticos.

## Cómo probar
La app es index.html; la búsqueda y la auditoría requieren endpoints serverless api/discover.js y api/audit.js. Ejecución de tests: npm test (Node.js >=20). CSV: columnas name,sector,city,website,email,phone. Guardar backup JSON antes de cambiar de dispositivo o navegador.

## Límites honestos
- Persistencia en localStorage del navegador: no hay login, base compartida ni sincronización. No cargar secretos ni datos privados.
- OpenStreetMap es colaborativo y puede fallar o tener datos desactualizados. Respetar licencia ODbL; verificar cada contacto.
- Auditoría HTML no equivale a UX, WCAG, Lighthouse ni PageSpeed. Si el sitio bloquea lectura, no se le atribuyen defectos.
- Endpoint valida HTTPS y DNS público, pero requiere límites de uso antes de producción.
- Emails solo borradores; nunca se envían automáticamente.
- OpenAI/Claude/Gemini no integrados aún; modo sin IA funciona.
- Verificar logos, fuentes y permisos antes de publicación de propuestas.
- Hosting solo preview de desarrollo; comprobar plan y condiciones para uso comercial.

## Siguiente fase
Autenticación, PostgreSQL, protección API y límites, métricas Lighthouse/axe, adaptadores de IA intercambiables, QA con navegador y URL HTTPS comprobada.

Empresas DEMO iniciales son ficticias. Sepelios Morón es trabajo de portfolio, no prospecto.
