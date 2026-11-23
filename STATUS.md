# STATUS · Primera ejecución 21/11/2026

**Repositorio personal:** fedeposada-front/freelance-growth-os
**Rama aislada:** mvp/freelance-growth-os
**PR abierto en borrador:** https://github.com/fedeposada-front/freelance-growth-os/pull/1
**Preview de evaluación:** https://freelance-growth-os-mvp.vercel.app/
**Despliegue probado en build:** dpl_F3Ks15271uB8XSuzSvi8TQCpY8r6 · commit 6987502be44beadab7e7e33bedf3dd8d4fefd134 · READY
**GitHub CI:** PASS para commit 6987502be44beadab7e7e33bedf3dd8d4fefd134 (run 44949759173).

## Implementado con código y desplegado
- [x] Radar personal responsive, agregar empresas manualmente, importar CSV.
- [x] Descubrimiento por fuente pública OSM/Overpass, deduplicación; endpoint aún no testeado en vivo.
- [x] Ficha de empresa, contactos con fuente, notas, presupuesto y etapas CRM.
- [x] Auditoría HTML HTTPS con señales y evidencia, sin resultados inventados; endpoint aún no testeado en vivo.
- [x] Scoring determinista, filtro y pipeline.
- [x] Borrador editable sin auto-SEND, plantilla funeraria conceptual, export PDF por impresión.
- [x] Modo sin IA, proveedores opcionales desactivados explícitamente.
- [x] Persistencia localStorage con export/import JSON.
- [x] Validación JS en motor V8; GitHub Actions CI pasó pruebas de Node y parsing de app.
- [x] Despliegue Vercel personal con dominio HTTPS y build READY.

## NO declarar beta completa todavía
- [ ] Smoke E2E de navegador real y acceso desde el móvil del propietario: el verificador web externo no pudo acceder a dominio recién creado. Vercel indicó READY, que no equivale a prueba funcional completa.
- [ ] Probar /api/audit y /api/discover desde cliente autorizado; Overpass puede fallar por límites.
- [ ] PostgreSQL y autenticación; localStorage sólo piloto local, no sirve para trabajo multidispositivo.
- [ ] API con rate limiting robusto/controles de seguridad antes de abrir captación comercial real.
- [ ] Lighthouse, axe, mejor evaluación de UX.
- [ ] Adaptadores server-side con proveedores IA (OpenAI, Claude, Gemini) opcionales.
- [ ] Revisar condiciones del hosting gratis para cualquier uso comercial y trasladar si corresponde.

## Próxima corrida automática obligatoria
1. Comprobar la URL y los dos endpoints con test real, corregir causas de fallos sin inventar evidencia.
2. Mejorar protección de APIs y persistencia para base compartida segura; no crear gastos, cuentas o claves nuevas.
3. Incorporar Playwright/Lighthouse/axe o alternativa viable y casos verificados.
4. Ejecutar CI y QA responsive y actualizar STATUS con estado de evidencia; seguir hasta MVP de punta a punta aceptable.

No tocar Co.Municarse ni WEBINOW; no autoenviar correos.

## QA funcional actualizado · 21/11/2026 18:12 ART
- [x] Public URL smoke: home HTTPS HTTP 200 + HTML de radar/propuestas presentes.
- [x] Endpoint /api/audit remoto: JSON válido, estado real `consultado` para https://www.sepeliosmoron.com.ar/ en GitHub Actions (run 44950213210).
- [x] Chromium Playwright E2E **PASS**: crear prospecto DEMO, modificar ficha, etapa, navegar pipeline, editar/guardar propuesta, recargar y mantener datos, viewport desktop y mobile, sin errores JavaScript. Evidencia: https://github.com/fedeposada-front/freelance-growth-os/actions/runs/44950213210 ; job 136986258608, mensaje `PASS: desktop + mobile navigation; create, save, stage, persist and proposal`.
- [x] CI de Node/validación JS previa y Vercel READY, URL: https://freelance-growth-os-mvp.vercel.app/ .
- [ ] API /api/discover Overpass **no testeada** con datos reales; verificar disponibilidad, límites y licencia.
- [ ] Auth + PostgreSQL, PageSpeed/axe, IA intercambiable real, accesibilidad profunda, prueba envío NO (prohibido), uso comercial condicionado por hosting.

**Decisión:** MVP experimental externo y funcional para test personal, pero NO beta comercial ni sistema completo. Continuar automatización horaria enfocada en persistencia segura, auditoría verificable y descubrimiento, sin gastos ni auto-SEND.


## Ejecución 21/11/2026 · 18:56 ART — validación de descubrimiento
- Commit nuevo: `2a06bd4e6c9b3f53e13ae9691a85a1f78eab75b4`.
- Añadido `tests/discover.test.js`: 4 pruebas de contrato con `fetch` simulado para fuente OSM, procedencia verificable, método inválido, fallo HTTP 429 y sanitización de campos/URLs. Se trata de pruebas simuladas, **NO** validan disponibilidad real de Overpass.
- Inspección del endpoint `api/discover.js`: consulta Overpass por área/rubro, devuelve `sourceUrl`, ODbL y no inventa empresas cuando la fuente falla.
- Acceso directo a la URL desde el entorno de esta ejecución: sin resolución DNS / acceso web; **no** atribuir a la aplicación una caída, ni declarar descubrimiento remoto PASS.
- CI para el nuevo commit: todavía sin ejecución confirmada al consultar GitHub. Próxima ejecución debe verificar checks y corregir cualquier fallo.
- Sin bloqueos que justifiquen intervención manual: las verificaciones pueden continuar mediante CI y herramientas conectadas. **No enviar email de bloqueo.**
- Prioridad siguiente: disparar/verificar integración en CI de /api/discover contra fuente real con límites de tiempo y registrar si está disponible, sin datos inventados. Luego avanzar en seguridad y persistencia.

## Ejecución 21/11/2026 · 19:54 ART — robustez del descubrimiento
- Cambio concreto en `api/discover.js`: validar tipo e ID de cada elemento OSM, limitar procesamiento a 300 elementos, eliminar duplicados por tipo/ID y tolerar JSON inesperado sin inventar registros.
- Regresiones agregadas en `tests/discover.test.js`: 2 tests nuevos de payload malformado, duplicados y ausencia de array.
- Commits: `41f1333404a57f23ec4c69f127af4db226f7811c` (implementación), `9e472cb2fdcb3138df0aff3b4fd366fc4875298b` (tests).
- Consulta de workflow runs asociada al último commit: sin runs aún; **CI pendiente, no declarar PASS**.
- Intento de smoke directo contra `https://freelance-growth-os-mvp.vercel.app/api/discover?zone=caba&sector=funeral`: el entorno de ejecución no resuelve DNS. Esto **no demuestra caída de Vercel**. Validación live Overpass pendiente.
- Sin bloqueo humano confirmado: seguir con CI y otras rutas de validación; no enviar email de bloqueo.
- Próxima corrida: comprobar CI del commit 9e472cb2, validar descubrimiento vivo por CI con timeout y verificar protección de APIs; continuar con persistencia segura.

## Ejecución 21/11/2026 · 20:59 ART — causa raíz del CI y corrección
- GitHub Actions CI del commit 9e472cb: **FAIL**, run https://github.com/fedeposada-front/freelance-growth-os/actions/runs/44959187760, test 6/8. El fallo fue una **fixture de prueba incorrecta**, no un fallo demostrado del endpoint: la cadena de prueba usaba barras invertidas literales `\\n` en lugar de un salto de línea real; por eso el sanitizador devolvió literalmente `A\\nB` en vez de `A B`.
- El smoke público del mismo commit: **PASS**, run https://github.com/fedeposada-front/freelance-growth-os/actions/runs/44959187828. Esto no prueba el descubrimiento Overpass real.
- Corregida la fixture con `String.fromCharCode(10)` para probar un carácter de control real, en commit `a3315e8a53472ff63a512cf67bd5f78d7ed91a6f`.
- CI de la corrección: **pendiente**, sin workflow asociado al commit en la consulta inmediata; no declarar PASS hasta ver resultado.
- Próximo: verificar CI de a3315e8; probar /api/discover en vivo; continuar seguridad y persistencia. Sin bloqueo humano, sin correo de alerta.


## Ejecución 21/11/2026 · 21:54 ART — CI recuperada y validación de filtros
- Verificación retrospectiva del commit `a3315e8a53472ff63a512cf67bd5f78d7ed91a6f`: **CI PASS** en GitHub Actions runs [44964472747](https://github.com/fedeposada-front/freelance-growth-os/actions/runs/44964472747) y [44964473021](https://github.com/fedeposada-front/freelance-growth-os/actions/runs/44964473021), ambos completados con conclusion=success. Estado Vercel success. Esto confirma la corrección de fixture previa, NO prueba Overpass real.
- Defecto corregido: filtros de descubrimiento de zona/rubro desconocidos caían silenciosamente a AMBA/funerarias y podían generar leads incorrectamente clasificados. Ahora se devuelve HTTP 400 con valores permitidos, sin consultar Overpass.
- Commits: `17dc9b755c7f33d57e7e8a59cd882c855c2ebb09` (validación), `55c45666b0c59d12682623f6335acd417707ef43` (test de regresión con fetch prohibido para filtros inválidos).
- CI de estos dos commits: aún pendiente de confirmación; no declarar PASS.
- Sigue pendiente prueba live Overpass y persistencia/auth segura. No existe bloqueo humano imprescindible, no enviar email.


## Ejecución 21/11/2026 · 23:03 ART — distinguir fallo de fuente y cero resultados
- Verificada la CI del commit anterior `55c45666b0c59d12682623f6335acd417707ef43`: dos workflows completados **PASS**: https://github.com/fedeposada-front/freelance-growth-os/actions/runs/44968951298 y https://github.com/fedeposada-front/freelance-growth-os/actions/runs/44968951237.
- Corregido `api/discover.js`: Overpass puede responder HTTP 200 con un cuerpo JSON inválido o con `remark` de error. Antes se interpretaba como búsqueda válida sin empresas; ahora devuelve HTTP 503 con mensaje honesto y no genera leads ficticios. Commit `49edb97a055947e1046c77ab3e3edc56b5fb85a1`.
- Ampliadas pruebas de regresión: respuesta malformada, `remark` con timeout y verdadero resultado vacío. Commit `38e7569ef34a7c0ba17ea023258bccb5522f5539`.
- CI de los cambios nuevos: pendiente de confirmación; no declarar PASS todavía.
- El entorno de ejecución continúa sin resolver el dominio Vercel mediante DNS, por lo que no se ha comprobado /api/discover en vivo; no es evidencia de caída de producción.
- Sin bloqueo humano imprescindible: no enviar correo. Siguiente corrida: verificar CI de 38e7569, intentar smoke remoto vía GitHub Actions y avanzar persistencia/auth sin gastos.

## Ejecución 22/11/2026 · 00:00 ART — evitar falsos hallazgos UX en HTML truncado
- CI de commit previo `38e7569`: **PASS** en dos workflows, runs [44974318861](https://github.com/fedeposada-front/freelance-growth-os/actions/runs/44974318861) y [44974318757](https://github.com/fedeposada-front/freelance-growth-os/actions/runs/44974318757).
- Defecto comprobado por inspección de código: `readLimited` detenía la descarga HTML en 350 KB pero devolvía un fragmento como si fuera el documento completo. Esto podía generar falsos hallazgos de título, H1 o contactos ausentes.
- Corregido `api/audit.js`: devuelve `{html,truncated}` y el endpoint informa `no_consultado` cuando el documento excede 350 KB, sin atribuir defectos UX. Commits `4450aa0` y `2735ffa`.
- Agregadas dos regresiones con ReadableStream para respuesta completa y truncada en `tests/audit.test.js`. Commit `06a401a857f3af693a29d2137805e29d3413bb85`.
- CI del commit nuevo aún sin ejecución disponible en consulta inmediata; **NO declarar PASS**.
- Overpass en vivo, autenticación/persistencia y evaluación Lighthouse/axe siguen pendientes. Sin intervención manual imprescindible; sin correo de bloqueo.
- Próximo: confirmar CI de `06a401a`, smoke real de /api/discover vía GitHub Actions, y avanzar persistencia segura.


## Ejecución 22/11/2026 · 00:56 ART — respuesta HTML sin cuerpo
- Confirmada CI de commit previo `06a401a`: MVP CI PASS https://github.com/fedeposada-front/freelance-growth-os/actions/runs/44978670998 y Public URL smoke PASS https://github.com/fedeposada-front/freelance-growth-os/actions/runs/44978670858. Esas ejecuciones no validan los commits nuevos.
- Corregido `api/audit.js`: `readLimited` devolvía un string vacío cuando `response.body` no existía, violando el contrato esperado `{html,truncated}`. El endpoint ahora clasifica cuerpos HTML vacíos como `no_consultado` y no inventa hallazgos de UX.
- Commits `f3ea9e27e51f5484c7b29dfd3f331fd30bfdc13a` (fix) y `c40375c84d17ac81cfa6762a7434cb31ac2899e7` (regresiones de body ausente y stream vacío).
- CI nueva pendiente de confirmación; no declarar PASS hasta inspeccionarla. No hay prueba live de Overpass ni persistencia segura. Sin bloqueo humano indispensable; sin correo.
- Próximo: confirmar CI de `c40375c`, implementar validación live controlada de Overpass en CI y priorizar persistencia/autenticación sin costo.

## 22/11/2026 01:59 ART
- Commit 86da0f2: CI incluye smoke externo de descubrimiento con timeout 25s, validación de JSON, licencia ODbL y procedencia OSM. Es no bloqueante por depender de Overpass; no equivale a PASS hasta leer logs de GitHub Actions.
- Persistencia segura y autenticación pendientes. Sin bloqueo humano.

## 22/11/2026 · 02:56 ART — evidencia de Overpass y sanitización
- CI anterior del commit 86da0f2: [MVP CI #44987418766](https://github.com/fedeposada-front/freelance-growth-os/actions/runs/44987418766) y [Public URL smoke #44987418755](https://github.com/fedeposada-front/freelance-growth-os/actions/runs/44987418755) terminaron con conclusion=success.
- **Resultado específico de la prueba live** (logs job 137100949329): `LIVE DISCOVERY NOT VERIFIED: Invalid discovery response: 503`. El paso está marcado como exitoso por ser no bloqueante; NO equivale a PASS del descubrimiento. Se requiere diagnosticar si el 503 procede del proveedor, timeout o endpoint desplegado, y considerar un segundo endpoint Overpass público permitido, sin inventar registros.
- Cambios nuevos: `51827252` endurece la adaptación de campos OSM (no convierte arrays/objetos en textos comerciales, no acepta URL con credenciales, conserva fallback de localidad); `cbea9341` agrega prueba de regresión de valores malformados. CI de estos commits todavía pendiente, no declarar PASS.
- Persistencia localStorage sin autenticación sigue siendo piloto local y NO apta para datos privados multidispositivo. No hay bloqueo humano demostrado, no se envía email.
- Prioridad: inspeccionar causa del 503 de descubrimiento remoto y resolver con alternativa gratuita/segura; verificar CI nueva; luego auth/persistencia.


## 22/11/2026 · 03:55 ART — fallback Overpass sin datos ficticios
- Diagnóstico de código: el descubrimiento consultaba exclusivamente `overpass-api.de`; un 503 upstream provocaba fallo de todo el descubrimiento. El run 44987418766 había observado 503 remoto, sin atribución concluyente al proveedor.
- Implementado fallback secuencial y acotado a `overpass.kumi.systems` si el primario falla (HTTP no-2xx, error JSON, remark o timeout). Cada intento tiene timeout de 8,5 s; sin fuentes válidas devuelve 503 explícito, nunca una lista vacía falsa. Se registra `providerUrl` en la respuesta exitosa.
- Commits: `f148fa45f920b94982b94410f06687194cca8ddb` (código), `3dbdfbe078f368ccb8c84ea99ba657bae079513b` (dos regresiones: recuperación tras 503 y fallo total).
- **QA PENDIENTE**: consulta inmediata a workflow runs del último commit devolvió cero resultados. No se ejecutaron tests locales ni se verificó disponibilidad live de ambos proveedores en esta corrida. Verificar CI y smoke remoto en próxima ejecución; no declarar PASS.
- Advertencia: el presupuesto máximo combinado de dos intentos es ~17 s más procesamiento; revisar límites del runtime Vercel si surge timeout. Los endpoints públicos pueden cambiar o tener restricciones de uso; conservar CSV como alternativa.
- No hay bloqueo humano imprescindible; no enviar correo. Persistencia segura y autenticación siguen pendientes.

## 22/11/2026 · 05:03 ART — CI y diagnóstico del 503 persistente
- Confirmado **MVP CI PASS** para commit `3dbdfbe` en [run 44995928474](https://github.com/fedeposada-front/freelance-growth-os/actions/runs/44995928474): 18 pruebas unitarias PASS, incluida recuperación simulada del fallback. [Public URL smoke 44995928482](https://github.com/fedeposada-front/freelance-growth-os/actions/runs/44995928482) también concluyó success.
- **Descubrimiento real NO VERIFICADO**: logs del job 137126831329, 22/11 06:56 UTC, muestran `LIVE DISCOVERY NOT VERIFIED: Invalid discovery response: 503`; el paso informativo falla pero el workflow global figura success. No atribuir aún el 503 a Overpass ni afirmar que el fallback esté desplegado.
- Commit `d80f441ca236bfc602ff790831b977306fa9e748`: mejorado el diagnóstico de CI para mostrar motivo de error acotado a 280 caracteres en próxima ejecución, sin datos de empresas ni secretos. No cambia la app ni acredita reparación del 503.
- Pendiente: inspeccionar próximo log, discriminar deployment desactualizado vs timeout/upstream, corregir causa y verificar consulta real; avanzar auth/persistencia. No hay acción humana indispensable demostrada; sin correo de bloqueo.

## 22/11/2026 · 06:00 ART — diagnóstico de versión pública y despliegue correctivo
- GitHub Actions del commit `d80f441` pasó en [CI 45001062666](https://github.com/fedeposada-front/freelance-growth-os/actions/runs/45001062666) y [smoke 45001062739](https://github.com/fedeposada-front/freelance-growth-os/actions/runs/45001062739). El paso live de discovery sigue **NO VERIFICADO**: log del job 137142465238 indica HTTP 503 y el mensaje `OpenStreetMap/Overpass respondió HTTP 502`. Ese mensaje **no existe** en la versión actual `api/discover.js` (fallback de dos proveedores), por lo que el dominio público estaba sirviendo una versión anterior. Esto demuestra desalineación entre el endpoint probado y la rama QA, no un fallo demostrado del fallback nuevo.
- Vercel personal: proyecto `prj_5P2SW7NSH1y9wHkYsB68AiVHADf9`, despliegues recientes de `mvp/freelance-growth-os` tenían `target=null` (preview) pese a `READY`; por ello no actualizaban necesariamente el dominio de producción `freelance-growth-os-mvp.vercel.app`.
- Se solicitó **despliegue explícito a production** desde la rama personal y commit `d941c20b4453ac6b1e2c5da9973699730dbf7261`, deployment `dpl_EZnWjoSf9tH9wrWYjvcYj459pfBe`. Al consultar inicialmente, estado **BUILDING**, todavía NO PASS ni endpoint validado. No se tocaron servicios corporativos ni se contrató un plan pago.
- Siguiente: confirmar READY y alias de producción, ejecutar prueba real de `/api/discover` contra versión actualizada, revisar resultado y seguir con autenticación/persistencia. No hay intervención humana imprescindible identificada ni correo de bloqueo.

### Confirmación del despliegue correctivo
- Vercel confirmó `dpl_EZnWjoSf9tH9wrWYjvcYj459pfBe` como **READY**, `target=production`, `aliasError=null`, y el alias **freelance-growth-os-mvp.vercel.app** asociado al commit `d941c20`. Esto sí corrige la desalineación de versión del dominio; **NO** valida todavía Overpass real.
- Intento de GET desde el entorno de ejecución: falla DNS local (`NameResolutionError`); no se interpreta como caída de Vercel. El smoke real remoto debe volver a ejecutarse contra este alias actualizado para comprobar el fallback y el JSON.


## 22/11/2026 · 07:03 ART — trazabilidad de versión desplegada
- Diagnóstico: Vercel confirmó READY de producción para `d941c20`, pero el entorno actual sigue sin resolver DNS del dominio público. No se declara smoke ni Overpass live PASS.
- Commit `4455fe8191cebb68cd27ccf45984a2c59395b46f`: `api/discover.js` agrega header `X-App-Revision` con `VERCEL_GIT_COMMIT_SHA` validado (40 caracteres hexadecimales), o `unknown`; no expone credenciales. Permite comparar el código desplegado con la rama y distinguir nuevamente producción desactualizada de fallos upstream.
- Commit `5442489e8a1d821119d6d5e8fbacebb98b2e4cb4`: regresión de header y `Cache-Control: no-store`. CI de estos commits aún sin verificación; no declarar PASS.
- La producción sigue en `d941c20` hasta nuevo deploy explícito. Siguiente ejecución: verificar CI, desplegar commit de QA en producción gratuita si las pruebas pasan, comprobar `X-App-Revision` en endpoint remoto y discovery real. Autenticación y persistencia segura siguen pendientes; no hay acción manual indispensable ni correo.


## 22/11/2026 · 08:00 ART — promoción de revisión QA a producción
- Verificado HEAD de PR #1 en rama aislada: `162cb7a9b6b47119dd815c867656663c0b0677ce`. CI de ese commit: [MVP CI 45010606542](https://github.com/fedeposada-front/freelance-growth-os/actions/runs/45010606542) y [Public URL smoke 45010606541](https://github.com/fedeposada-front/freelance-growth-os/actions/runs/45010606541), ambos `completed/success`. El smoke puede pasar aunque la comprobación Overpass informativa no lo haga: no se declara discovery live PASS.
- Confirmado que el alias público seguía en producción `d941c20` (deploy READY `dpl_EZnWjoSf9tH9wrWYjvcYj459pfBe`), por lo que el header `X-App-Revision` aún no estaba en producción.
- Solicitado despliegue de producción gratuito sobre el **mismo proyecto personal**, desde SHA `162cb7a`, deployment `dpl_5XHz2r1MKYTbNMwBMmkDF8qeZ6EP`. Última lectura: `BUILDING`; **no declarar READY** hasta nueva consulta. No se modificaron repos corporativos, Co.Municarse ni configuraciones de pago.
- Smoke directo de endpoint desde el acceso web disponible no obtuvo respuesta accesible; no se infiere falla de aplicación ni se atribuye PASS.
- Próxima ejecución: comprobar READY + alias + `X-App-Revision`, revisar logs del smoke remoto y resultado live OSM; continuar autenticación y persistencia segura. Sin bloqueo humano confirmado y sin correo.

### Confirmación posterior de despliegue 08:00 ART
- Vercel devolvió **READY**, `target=production`, `aliasError=null` para `dpl_5XHz2r1MKYTbNMwBMmkDF8qeZ6EP`; alias `freelance-growth-os-mvp.vercel.app` asociado a `162cb7a`. Es prueba de publicación, **no** de funcionamiento E2E ni de Overpass real.


## 22/11/2026 08:58 ART — auditoría HTML: evitar falsos positivos
- Inspeccionados `api/audit.js`, `api/discover.js`, tests y estado documental de la rama personal.
- Defecto corregido: la detección heurística de `meta viewport` y `meta description` dependía de una forma estrecha del HTML. Ahora busca atributos `name` en las etiquetas meta independientemente de su orden; evita atribuir faltantes inexistentes.
- Commits: `7547e3a19642c63761a64ee7d231fa90347d04b3` (código) y `af5968c72c4f437e727cc7a455e6d952086387de` (regresión).
- Verificación puntual del patrón con Node local: 2 ejemplos de etiquetas meta con orden distinto reconocidos. **No equivale a ejecutar toda la suite ni smoke HTTPS**. CI de estos commits pendiente; no declarar PASS.
- Siguen pendientes autenticación/persistencia segura y validación live del descubrimiento Overpass. Sin bloqueo humano indispensable confirmado; no se envió email.


## 22/11/2026 · 10:03 ART — corrección del detector meta
- Revisión del código real encontró un error en la corrección previa: expresiones regulares con barras escapadas de más podían seguir atribuyendo ausencia de viewport/description incluso presentes. Además, una búsqueda textual ingenua podía reconocer falsamente `data-name` o texto dentro de `content`.
- Implementado parser acotado de pares atributo/valor para etiquetas `meta` en `api/audit.js`; acepta atributos entrecomillados o sin comillas, sin confundir `data-name` con `name`. Commits `fca8908`, `dd45098`, `f1a8353`.
- Regresión añadida en `tests/audit.test.js` para valores sin comillas y atributos engañosos: commit `9c44f6e`.
- **QA pendiente:** no se verificó aún CI para `f1a8353`, ni despliegue de esta revisión, ni E2E HTTPS. No declarar PASS. Siguiente corrida: inspeccionar CI y corregir fallos, luego priorizar autenticación/persistencia y smoke remoto.
- Sin bloqueo humano demostrado; no se envió email. Ningún cambio en Co.Municarse ni proyectos corporativos.

## 22/11/2026 · 11:00 ART — extracción de descripción consistente
- Inspección del código detectó que `findingsFromHtml` ya reconocía etiquetas meta con atributos reordenados, pero la función `meta()` usada para devolver el texto de descripción todavía exigía `name="description"` y `content` entre comillas; podía devolver una descripción vacía aunque la etiqueta existiera.
- Corregida extracción con pares atributo/valor y normalización de nombre; evita coincidencias con `data-name`. Commits `82196a5`, `fd532be`.
- Agregada regresión de descripción con atributos reordenados, sin comillas y atributos engañosos, commit `1cb6db6`.
- **No se ejecutó suite ni se confirmó CI para el nuevo HEAD**; no declarar PASS ni despliegue. Próximo: confirmar CI, promover a hosting gratuito y verificar respuesta HTTPS, luego priorizar autenticación/persistencia segura.
- Sin bloqueo humano nuevo confirmado; sin correo.

## 22/11/2026 · 11:55 ART — métricas observadas de auditoría
- Commit `a57427e613b59eebcdfed8da7f1066483ef262d6`: la respuesta `consultado` de `/api/audit` ahora incluye `httpStatus` real, `elapsedMs` medido desde el inicio de la operación (incluye resolución DNS, red y lectura HTML) y `htmlBytes` del HTML efectivamente descargado. Son medidas del servidor de auditoría, **no** Core Web Vitals, Lighthouse ni tiempos del navegador del cliente. No se generan métricas si la consulta no se completa.
- QA de esta revisión y despliegue HTTPS **pendientes**; no declarar PASS. Persistencia segura/login y discovery live continúan pendientes. Sin bloqueo humano indispensable confirmado; sin correo.

## 22/11/2026 · 13:02 ART — CI comprobada y promoción a producción
- Verificado en GitHub que el commit `ca06e6601bd71859817c95fa5c4b1d89ba3225e7` completó `MVP CI` con `success` ([run 45035450091](https://github.com/fedeposada-front/freelance-growth-os/actions/runs/45035450091)) y `Public URL smoke` con `success` ([run 45035450078](https://github.com/fedeposada-front/freelance-growth-os/actions/runs/45035450078)). El smoke no equivale a QA completo de autenticación, persistencia ni Overpass real.
- Vercel personal confirmó preview `READY` de `ca06e66` (deployment `dpl_B4TLQi4293KrWW4UcPr167QncSkv`). Solicitado despliegue **production** del mismo SHA en el proyecto personal existente `prj_5P2SW7NSH1y9wHkYsB68AiVHADf9`, deployment `dpl_4w982KFs7dvJThd56cxTohAPR3M4`. Primera comprobación: `BUILDING`; no declarar READY hasta verificarlo.
- Esta operación no crea proyecto, cuenta, plan ni gasto nuevo; no toca Co.Municarse ni servicios corporativos.
- Próxima ejecución: confirmar READY/alias y smoke HTTPS de producción; priorizar login/persistencia segura, prueba real de Overpass y E2E. No hay bloqueo humano indispensable identificado; sin correo de bloqueo.

### Confirmación del despliegue de las 13:02 ART
- Vercel devolvió `READY`, `target=production`, `aliasError=null` para `dpl_4w982KFs7dvJThd56cxTohAPR3M4`, commit `ca06e66`, alias `freelance-growth-os-mvp.vercel.app` asociado. Esto confirma publicación del código con métricas de auditoría, **no** smoke E2E de esa producción ni funcionalidad integral.


## 22/11/2026 · 14:03 ART — seguridad del auditor HTTPS
- Verificado Vercel personal: producción READY en deployment `dpl_4w982KFs7dvJThd56cxTohAPR3M4` (revisión `ca06e66`); no equivale a E2E del último commit.
- Corrección `02b8e04`: el filtro DNS de /api/audit rechaza además rangos IPv4 de documentación y especiales (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24, 192.88.99.0/24), para evitar consultas SSRF a destinos no públicos.
- Prueba `bb56485`: regresión de direcciones privadas, reservadas, documentación y direcciones públicas. CI del nuevo commit todavía NO verificada; no declarar PASS.
- Limitación: comprobación DNS previa a fetch no elimina por sí sola DNS rebinding; requiere pinning/verificación de IP en la conexión para producción multiusuario. No hay autenticación ni persistencia privada compartida. No exponer datos sensibles.
- Prioridad: verificar CI de bb56485, resolver DNS rebinding y seguridad de endpoints, avanzar auth/persistencia gratuita y E2E HTTPS. Sin bloqueo humano imprescindible; no enviar alerta.

## 22/11/2026 · 14:54 ART — validación de entrada de auditoría
- Se inspeccionó `api/audit.js`, sus regresiones y el historial de despliegues Vercel del proyecto personal. El preview del commit `c001dd3` figura READY; esto no equivale a producción ni a E2E PASS.
- Se detectó que `validTarget` permitía coerción implícita de parámetros no string (`new URL` sobre arrays de un elemento), situación posible con parámetros query repetidos. Ahora rechaza tipos no string y valores vacíos antes de parsear. Implementación `e5f7596`; prueba `cff14e4`.
- CI de estos commits y despliegue HTTPS de esta revisión: PENDIENTES; no se atribuye PASS.
- La auditoría continúa teniendo riesgo de DNS rebinding porque resuelve con `dns.lookup` y luego `fetch` vuelve a resolver; no declarar la API segura para uso público sin pinning DNS/TLS o mitigación equivalente. Auth y persistencia privada multidispositivo continúan pendientes.
- No hay acción humana indispensable demostrada; no enviar correo de bloqueo. Mantener el trabajo aislado en la rama personal.


## 22/11/2026 · 15:59 ART — falsos negativos en auditoría heurística
- Inspección de `api/audit.js`: `findingsFromHtml` podía interpretar ejemplos de HTML dentro de `<script>`, `<style>` o comentarios como etiquetas reales, ocultando señales ausentes (título, H1, meta y enlaces). Corregido al excluir esos bloques antes de las comprobaciones heurísticas.
- Commits `9fb5ffddfe7b10c092b45a2b8685940af5abdf6d` (código) y `95e18fdd407830a56fa22fbd4255f378651b55da` (regresión con seis señales faltantes).
- Vercel mostró preview READY del commit anterior `0bc7c73`, no de estos commits. CI y despliegue de los cambios nuevos **no verificados** en esta ejecución; no declarar PASS.
- Esta mejora no resuelve el riesgo de DNS rebinding, autenticación/persistencia segura ni Overpass real. No hay bloqueo humano indispensable; no se envió correo.


## 22/11/2026 19:03 ART — pinning DNS/TLS del auditor
- Inspeccionado `api/audit.js` y sus pruebas. Se identificó el desacople entre `dns.lookup` y `fetch`, que podía resolver nuevamente el hostname y permitir DNS rebinding.
- Implementación commit `e7e42ed`: reemplazado `fetch` por `https.request` con callback `lookup` fijado a la IP pública previamente validada, SNI y validación de certificado para el hostname original, sin redirecciones. Se conserva el timeout y el límite de HTML.
- Prueba de regresión commit `8ab0857`: una conexión a `example.com` con IP fijada deliberadamente a loopback debe fallar, sin volver a resolver el dominio. El handler nunca debe seleccionar loopback porque `publicAddress` lo rechaza.
- CI y smoke HTTPS de estos commits todavía pendientes de confirmación. Esta corrección reduce riesgo de DNS rebinding, pero no sustituye rate limiting, login, persistencia privada ni revisión de otros vectores SSRF. No declarar MVP completo.
- Sin intervención humana imprescindible ni correo de bloqueo; siguiente ejecución verificar CI y endpoint remoto, corregir cualquier regresión.


## 22/11/2026 19:58 ART — regresión DNS pinning detectada y corregida
- CI de `0ab0997`: **FAIL** en [MVP CI #45075556726](https://github.com/fedeposada-front/freelance-growth-os/actions/runs/45075556726), 25/26 tests PASS. `Public URL smoke #45075556708` PASS, pero prueba una URL de producción de revisión anterior.
- Causa reproducida en logs: Node `https.request` invoca `lookup` con `options.all=true` (autoSelectFamily); el callback anterior devolvía `(address, family)` en vez de un array de direcciones y provocaba `ERR_INVALID_IP_ADDRESS: undefined`.
- Corrección `86b7b1c`: el callback devuelve `[{address,family}]` cuando `options.all` es true y `(address,family)` cuando no. No se permite resolución DNS secundaria: la conexión sigue limitada a la IP validada.
- CI y HTTPS de la corrección aún **no verificados**. Preview READY anterior no equivale a E2E de esta revisión. Continuar con verificación de workflow y test de auditoría en preview; no promover a producción sin PASS.
- Autenticación y persistencia privada siguen pendientes. No hubo bloqueo humano ni correo.

## 22/11/2026 · 20:54 ART — CI del pinning DNS recuperada
- Verificación GitHub Actions del commit `2eca065d37b22c7491c5628f1fdcc923dce3ec6e`: **MVP CI PASS** run https://github.com/fedeposada-front/freelance-growth-os/actions/runs/45080742791 y **Public URL smoke PASS** run https://github.com/fedeposada-front/freelance-growth-os/actions/runs/45080742739. Ambos `completed/success`; el segundo comprueba la URL pública configurada, no un E2E del preview nuevo.
- Vercel personal reportó preview `dpl_2tuYWhV7kQ2cyayeHGu1Rd91x17L` en estado READY para `2eca065` (rama `mvp/freelance-growth-os`, `target=null`). **No se promovió a producción**: READY no demuestra auditoría real de red ni seguridad multidispositivo.
- Se releyeron `api/audit.js` y `tests/audit.test.js`: el pinning respeta `lookup(options.all)` y existe regresión para impedir fallback a DNS del hostname. La CI verde valida la suite existente; sigue sin ser una prueba E2E remota de auditoría con el nuevo transporte.
- Prioridades sin cerrar: prueba remota del endpoint `/api/audit` en el preview, descubrimiento Overpass real, autenticación y persistencia privada segura, QA E2E integral. Sin intervención manual indispensable identificada, sin correo de bloqueo.

## 22/11/2026 · 21:58 ART — límite de tiempo DNS del auditor
- Inspeccionados código, pruebas y despliegues personales. El auditor fijaba un timeout de 7 s **después** de `dns.lookup`; una resolución DNS lenta podía mantener la función esperando indefinidamente antes de iniciar la protección de red.
- Commit `c202f1c`: `resolvePublicAddresses` limita la espera DNS a 3 s, valida que las direcciones sean públicas y conserva el pinning TLS posterior. El límite del socket HTTPS sigue siendo 7 s. Una resolución DNS ya iniciada puede continuar en el sistema, aunque la petición deja de esperarla.
- Commit `6bccb5d`: prueba de regresión para resolución lenta, direcciones privadas, respuesta vacía y dirección pública.
- **CI y publicación de esta revisión no verificadas todavía**; no declarar PASS ni promoción. Persisten como P0 autenticación/persistencia privada y E2E remoto de Overpass/auditor.
- Vercel registra despliegues recientes de la rama aislada de Co.Municarse dentro del mismo proyecto, que **no se modificaron**. No se debe inferir que el último READY corresponde a Growth OS.
- Sin bloqueo humano demostrado ni correo de alerta.


## 22/11/2026 · 22:56 ART — auditoría de respuestas comprimidas
- Inspeccionado `api/audit.js`, pruebas y despliegues personales. El transporte HTTPS fijado a IP usa `https.request` y entrega bytes crudos, sin descompresión automática. Si el servidor envía `Content-Encoding: gzip/br/deflate`, interpretar esos bytes como HTML puede producir falsos hallazgos de título, H1 y contacto ausentes.
- Corregido para clasificar contenido comprimido como `no_consultado` y explicitar la limitación; no atribuir defectos UX sin HTML legible. También se normaliza la comparación de Content-Type. Commits `763af6e`, `082c1ef`, `7d47f43` (test unitario de codificaciones).
- CI del commit `7d47f43`: pendiente de verificación, no declarar PASS. Vercel mostró preview READY de la rama en revisión anterior `c2fb40f`, no prueba del cambio nuevo.
- Pendiente: autenticación/persistencia privada, Overpass live y E2E de revisión publicada. Sin bloqueo humano demostrado; sin correo de alerta ni promoción a producción.


## Ejecución 22/11/2026 · 23:58 ART — protección IPv6 SSRF
- Auditoría de `api/audit.js`: el filtro IPv6 previo sólo rechazaba `fe80:` y algunos prefijos; podía aceptar direcciones no globales y mecanismos de transición IPv4 embebida. Se endureció la política para aceptar únicamente IPv6 global-unicast nativa y excluir Teredo (`2001:0::/32`), 6to4 (`2002::/16`), documentación (`2001:db8::/32`, `3fff::/20`), NAT64 y direcciones no globales. La conexión sigue fijada a la IP validada con TLS del dominio.
- Implementación: commits `23e7b1d` y `053630a`; regresiones añadidas en `tests/audit.test.js` commit `3e25829`.
- **Pruebas de esta revisión: pendiente de CI**. No atribuir PASS a estos cambios hasta verificar los workflows. Producción HTTPS no promovida ni E2E validado en esta corrida.
- Bloqueos humanos nuevos: ninguno. Sin gastos, sin contactos comerciales, sin correos de bloqueo. Próximo: verificar CI, smoke de endpoint y avanzar autenticación/persistencia privada.

## 23/11/2026 · 01:54 ART — heurística de idioma del documento
- Verificados workflows de `bbfeb95`: Public URL smoke `45103256322` completed/success; CI previa también reportada exitosa. Estos checks no cubren la revisión nueva.
- Implementado en `api/audit.js` aviso heurístico de accesibilidad cuando la etiqueta raíz `<html>` no declara un `lang` válido. No se presenta como fallo WCAG confirmado; no se confunden atributos `data-lang` ni `lang` de descendientes.
- Commits `cdc8bf96` (implementación) y `386d47b5` (prueba y fixtures). La CI de estos commits aún no fue confirmada: NO declarar PASS ni promoción.
- Autenticación y persistencia privada multidispositivo, Overpass live y E2E HTTPS siguen pendientes. Sin gastos, emails ni intervención manual requerida.

## 23/11/2026 · Corrección de CI idioma HTML
- CI de `617df7e` falló: 29/30 pruebas, caso `data-lang` reconocido erróneamente como `lang` (run 45114645471, test 17). Public URL smoke sí pasó (45114645396); preview READY no implica E2E.
- Corregido en `7051991c1512e4eaf68aaba3922b4cef202ad20f`: exige espacio antes del atributo `lang` de `<html>` para evitar coincidir con `data-lang`. Regresión ya existente en `tests/audit.test.js` cubre `data-lang`, `lang` vacío, atributo de hijo y `es-AR`.
- CI del nuevo commit pendiente de comprobación. No promover a producción ni declarar MVP PASS hasta E2E real y privacidad/persistencia adecuadas.

## 23/11/2026 · 04:01 ART — presupuesto de ejecución Overpass
- Verificada CI de corrección anterior `4d0caa5`: MVP CI run [45121328148](https://github.com/fedeposada-front/freelance-growth-os/actions/runs/45121328148) y Public URL smoke [45121328014](https://github.com/fedeposada-front/freelance-growth-os/actions/runs/45121328014), ambos `completed/success`. Smoke público no demuestra que el commit nuevo esté desplegado.
- Inspeccionado `api/discover.js`: dos consultas secuenciales a Overpass de 8.5 segundos podían sumar ~17 segundos, arriesgando timeout de funciones gratuitas antes de devolver un error honesto o el fallback. Commit `742ed4943c315047da108b425464513711115ac9`: límite de 4 segundos por proveedor (~8 segundos en total, más procesamiento), manteniendo dos fuentes y error 503 sin leads ficticios.
- **CI de `742ed49` y prueba Overpass real pendientes**: cambio inspeccionado y persistido, no declarar PASS ni afirmar disponibilidad de la fuente. Un límite menor puede descartar respuestas lentas: CSV sigue como alternativa.
- Autenticación/persistencia privada multidispositivo y E2E HTTPS integral siguen P0. Sin bloqueo humano nuevo ni email; no hubo gastos ni envíos comerciales.

## 23/11/2026 · 05:00 ART — recuperación de URL HTTPS alternativa desde OSM
- Inspeccionados STATUS.md, package.json, api/discover.js y tests/discover.test.js en rama personal; no se tocó Co.Municarse.
- Defecto confirmado por inspección: al mapear registros OSM, un `website` presente pero no HTTPS ocultaba un `contact:website` válido y HTTPS. Se descartaba una web pública legítima, afectando el flujo descubrimiento → auditoría.
- Commit `0c4d21acb46cc0942bc11346f641350fd5fe8bed`: se evalúan ambos campos con la misma validación HTTPS, prefiriendo `website` válido y usando `contact:website` válido como fallback.
- Commit `53f773eadee8e061820221b6ca94b650717c1b04`: regresión para fallback HTTPS y prioridad de la web primaria válida.
- **NO PASS aún**: CI y despliegue de estos commits no comprobados; el contenedor no pudo resolver github.com, por lo que no se ejecutó test local remoto. Overpass live y E2E de esta revisión continúan sin verificar.
- Autenticación y persistencia privada multidispositivo siguen siendo bloqueo de aceptación del MVP, pero no hay acción humana imprescindible identificada; continuar implementando. No hubo gastos ni correo de bloqueo.
