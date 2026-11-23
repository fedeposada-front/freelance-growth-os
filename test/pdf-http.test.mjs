import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {jsPDF} from 'jspdf';

const root=fileURLToPath(new URL('../',import.meta.url));
const port=31000+Math.floor(Math.random()*20000);
const base='http://127.0.0.1:'+port;
const app=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,PORT:String(port)},stdio:'ignore'});

async function awaitServer(){
 for(let i=0;i<50;i++){
  if(app.exitCode!==null)throw Error('Server terminated before opening');
  try{const r=await fetch(base+'/api/health');if(r.ok)return}catch{}
  await new Promise(resolve=>setTimeout(resolve,200));
 }
 throw Error('Server failed to open HTTP port');
}
await awaitServer();
test.after(()=>app.kill());

test('Android-compatible HTTP PDF: prepare -> real attachment GET -> exact PDF bytes',async()=>{
 const pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4',compress:false});
 for(let i=0;i<7;i++){
   if(i)pdf.addPage();
   pdf.setFontSize(22);
   pdf.text('Co.Municarse / propuesta demo - pagina '+(i+1),15,25);
   for(let j=0;j<24;j++)pdf.text('Contenido comercial de prueba empresa '+i+' - '+j+' : '+'capacitacion '.repeat(4),15,40+j*6);
 }
 const binary=Buffer.from(pdf.output('arraybuffer'));
 assert.ok(binary.length>10000,'The fixture is a plausible PDF with pages');
 assert.equal(binary.subarray(0,5).toString('ascii'),'%PDF-');
 const prepare=await fetch(base+'/api/pdf-prepare',{
  method:'POST',
  headers:{'Content-Type':'application/pdf','X-Pdf-Filename':'CoMunicarse-Rizobacter-A4-horizontal.pdf'},
  body:binary
 });
 assert.equal(prepare.status,200);
 const item=await prepare.json();
 assert.match(item.downloadUrl,/^\/api\/pdf-download\/[0-9a-f-]{36}$/);
 assert.equal(item.expiresInMinutes,10);
 const result=await fetch(base+item.downloadUrl);
 assert.equal(result.status,200);
 assert.equal(result.headers.get('content-type'),'application/pdf');
 assert.match(result.headers.get('content-disposition'),/^attachment; filename="CoMunicarse-Rizobacter-A4-horizontal\.pdf"$/);
 assert.match(result.headers.get('cache-control'),/no-store/);
 const downloaded=Buffer.from(await result.arrayBuffer());
 assert.deepEqual(downloaded,binary);
});

test('Reject uploads that are not PDFs and unknown download tokens',async()=>{
 const bad=await fetch(base+'/api/pdf-prepare',{method:'POST',headers:{'Content-Type':'application/pdf'},body:'not a PDF'});
 assert.equal(bad.status,422);
 const wrongType=await fetch(base+'/api/pdf-prepare',{method:'POST',headers:{'Content-Type':'text/plain'},body:'test'});
 assert.equal(wrongType.status,415);
 const unknown=await fetch(base+'/api/pdf-download/11111111-1111-4111-8111-111111111111');
 assert.equal(unknown.status,404);
});
