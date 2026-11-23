import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';

const DIR=dirname(fileURLToPath(import.meta.url));
const W=841.89,H=595.28;
const C={ink:'#111111',ivory:'#F7F4ED',white:'#FFFFFF',pink:'#FF33CC',gold:'#FDC300',grey:'#625D64',pale:'#FBF4F8',edge:'#E4DCE1',muted:'#D9C8D2'};
const FONT={
 display:join(DIR,'node_modules/@expo-google-fonts/bebas-neue/400Regular/BebasNeue_400Regular.ttf'),
 regular:join(DIR,'node_modules/@expo-google-fonts/dm-sans/400Regular/DMSans_400Regular.ttf'),
 bold:join(DIR,'node_modules/@expo-google-fonts/dm-sans/700Bold/DMSans_700Bold.ttf')
};
let imageCache=null;
async function assets(){
 if(!imageCache){
  imageCache=Promise.all(['alicia-portada.webp','alicia-cierre.webp','alicia-firma-clara.webp'].map(async name=>{
   const src=await readFile(join(DIR,'public/assets',name));
   return sharp(src).png().toBuffer();
  })).catch(e=>{imageCache=null;throw e});
 }
 return imageCache;
}
function txt(value,max=1200){
 if(typeof value!=='string')return '';
 return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/\s+/g,' ').trim().slice(0,max);
}
function lines(value){
 if(!Array.isArray(value))return [];
 return value.map(v=>txt(v,130)).filter(Boolean).slice(0,3);
}
function arr(v,max=10){return Array.isArray(v)?v.slice(0,max):[]}
function fit(doc,text,x,y,w,h,{font='regular',size=14,min=9,color=C.ink,align='left',lineGap=2}={}){
 const t=txt(String(text??''),1800);if(!t)return 0;
 let current=size;
 doc.font(font).fontSize(current);
 let measured=doc.heightOfString(t,{width:w,lineGap,align});
 while(measured>h-3&&current>min+.01){
  current=Math.max(min,current-0.5);
  doc.fontSize(current);
  measured=doc.heightOfString(t,{width:w,lineGap,align});
 }
 if(measured>h+1)throw Error('El texto es demasiado largo para la maqueta; reducilo desde el editor antes de descargar.');
 doc.fillColor(color).text(t,x,y,{width:w,height:h,lineGap,align,ellipses:false});
 return Math.min(measured,h);
}
function block(doc,x,y,w,h,{fill=C.pale,radius=9,border=null}={}){
 doc.save().roundedRect(x,y,w,h,radius).fill(fill);
 if(border)doc.roundedRect(x,y,w,h,radius).lineWidth(.8).stroke(border);
 doc.restore();
}
function drawBg(doc,dark=false){
 doc.rect(0,0,W,H).fill(dark?C.ink:C.white);
 doc.save();
 doc.opacity(dark?.11:.06).circle(W-6,78,119).fill(C.pink);
 doc.opacity(dark?.07:.055).circle(6,H-65,92).fill(C.gold);
 doc.restore();
}
function footer(doc,num,dark){
 const line=dark?'#494047':'#DED7DC',color=dark?'#DECFD9':'#736970';
 doc.moveTo(50,553).lineTo(W-50,553).lineWidth(.65).strokeColor(line).stroke();
 fit(doc,'ALICIA CAMAÑO · CO.MUNICARSE',51,560,360,20,{font:'bold',size:8.3,min:8,color});
 fit(doc,'PROPUESTA CORPORATIVA · '+String(num).padStart(2,'0')+'/07',W-292,560,242,20,{font:'regular',size:8.2,min:8,color,align:'right'});
}
function mast(doc,page,dark){
 const kicker=txt(page.kicker,125);
 fit(doc,kicker||'CO.MUNICARSE · PROPUESTA CORPORATIVA',51,42,715,20,{font:'bold',size:9.3,min:8,color:dark?C.gold:'#A30F67'});
 const t=lines(page.titleLines);
 if(t.length===0)t.push('PROPUESTA','CORPORATIVA');
 const y=t.length>=3?77:91,step=t.length>=3?45:57,size=t.length>=3?45:57;
 for(let i=0;i<t.length;i++)fit(doc,t[i],50,y+i*step,740,step-1,{font:'display',size,min:32,color:(i===t.length-1&&t.length>1)?C.pink:(dark?C.white:C.ink),lineGap:0});
 const underlineY=y+t.length*step+5;
 doc.rect(52,underlineY,57,5).fill(C.gold);
 return Math.min(underlineY+28,251);
}
function pageno(doc,n,dark){footer(doc,n,dark);}
function imageFit(doc,buff,x,y,w,h){
 // fit preserves source aspect ratio; never specify both rendered width and height.
 doc.image(buff,x,y,{fit:[w,h],align:'center',valign:'center'});
}
function sectionLabel(doc,text,x,y,w,dark=false){
 fit(doc,text,x,y,w,18,{font:'bold',size:9.1,min:8,color:dark?C.gold:'#A11A68'});
}
function bullet(doc,text,x,y,w,maxh,{dark=false,size=13}={}){
 doc.circle(x+4,y+9,3.1).fill(dark?C.pink:C.pink);
 const ht=fit(doc,text,x+17,y,w-17,maxh,{font:'regular',size,min:10.1,color:dark?C.white:C.ink,lineGap:2});
 return Math.max(ht+8,30);
}
function titleText(page){return lines(page.titleLines)}
function renderCover(doc,p,imgs){
 drawBg(doc,true);
 sectionLabel(doc,p.kicker,52,65,450,true);
 const titles=titleText(p);
 let y=123;
 for(let i=0;i<titles.length;i++){
  fit(doc,titles[i],51,y,425,66,{font:'display',size:61,min:34,color:i===titles.length-1?C.pink:C.white,lineGap:0});y+=64;
 }
 doc.rect(53,y+7,54,4).fill(C.gold);
 fit(doc,p.data.client,53,309,435,44,{font:'bold',size:23.5,min:15,color:C.white});
 fit(doc,p.data.description,53,363,424,69,{font:'regular',size:15,min:12,color:'#EDE2EA'});
 const pills=arr(p.data.meta,3).map(v=>txt(v,60)).filter(Boolean);
 let x=53;
 for(const pill of pills){
  const pw=Math.min(155,Math.max(85,doc.font('bold').fontSize(10.5).widthOfString(pill)+24));
  doc.roundedRect(x,485,pw,32,15).lineWidth(1).strokeColor('#705C68').stroke();
  fit(doc,pill,x+10,493,pw-20,21,{font:'bold',size:10.2,min:9,color:C.white,align:'center'});
  x+=pw+9;
 }
 // Brand circle is behind an undistorted, contained portrait cutout.
 doc.save().opacity(.98).circle(671,331,125).fill(C.pink).restore();
 imageFit(doc,imgs[0],513,142,295,385);
 pageno(doc,1,true);
}
function renderContext(doc,p){
 drawBg(doc);
 mast(doc,p,false);
 const d=p.data;
 sectionLabel(doc,d.leftLabel||'PUNTO DE PARTIDA',52,250,320);
 fit(doc,d.lead,52,275,332,55,{font:'bold',size:24,min:17});
 fit(doc,d.sector,52,333,330,24,{font:'bold',size:12.3,min:10});
 fit(doc,d.context,52,370,330,109,{font:'regular',size:13.5,min:10.4,lineGap:2});
 fit(doc,d.caveat,52,493,330,42,{font:'regular',size:10,min:9,color:C.grey});
 block(doc,423,245,364,247,{fill:C.ink,radius:7});
 sectionLabel(doc,d.rightLabel||'OBJETIVO DEL ENTRENAMIENTO',446,265,316,true);
 fit(doc,d.panelLead,446,299,319,85,{font:'bold',size:22,min:15,color:C.white});
 fit(doc,d.panelBody,446,391,318,86,{font:'regular',size:13.5,min:11,color:'#E8DBE4'});
 fit(doc,d.source,429,505,354,37,{font:'regular',size:10,min:9,color:C.grey});
 pageno(doc,2,false);
}
function renderProgram(doc,p){
 drawBg(doc);mast(doc,p,false);
 const list=arr(p.data.programs,4);
 const rects=[[52,250],[426,250],[52,382],[426,382]];
 for(let i=0;i<4;i++){
  const [x,y]=rects[i],d=list[i]||{};
  block(doc,x,y,363,119,{fill:C.pale,radius:8,border:C.edge});
  fit(doc,String(i+1).padStart(2,'0'),x+18,y+12,52,33,{font:'display',size:30,min:26,color:'#B0106E'});
  fit(doc,d.title,x+74,y+17,269,31,{font:'bold',size:17,min:12});
  fit(doc,d.body,x+19,y+58,320,57,{font:'regular',size:12.4,min:10.5});
 }
 fit(doc,p.data.note,53,512,720,33,{font:'regular',size:10.4,min:9.4,color:C.grey});
 pageno(doc,3,false);
}
function renderMethod(doc,p){
 drawBg(doc,true);const y=mast(doc,p,true);const d=p.data;
 const specs=arr(d.specs,3);
 for(let i=0;i<3;i++){
  const x=52+i*248,sp=specs[i]||{};
  block(doc,x,239,237,79,{fill:'#282027',radius:5});
  doc.rect(x,239,237,3).fill(C.gold);
  fit(doc,sp.label,x+15,252,208,20,{font:'bold',size:9.5,min:9,color:'#CEB9C7'});
  fit(doc,sp.value,x+15,279,207,33,{font:'bold',size:18,min:12,color:C.white});
 }
 const phases=arr(d.phases,3);
 for(let i=0;i<3;i++){
  const x=53+i*248,q=phases[i]||{};
  if(i)doc.moveTo(x-12,344).lineTo(x-12,494).lineWidth(.7).strokeColor('#66535D').stroke();
  fit(doc,String(i+1).padStart(2,'0'),x,348,210,45,{font:'display',size:35,min:30,color:C.pink});
  fit(doc,q.title,x,398,212,33,{font:'bold',size:20,min:15,color:C.white});
  fit(doc,q.body,x,438,212,75,{font:'regular',size:12.5,min:10.3,color:'#E2D5DE'});
 }
 fit(doc,d.note,52,519,734,30,{font:'regular',size:9.7,min:9,color:'#CFBBC6'});
 pageno(doc,4,true);
}
function renderOutcome(doc,p){
 drawBg(doc);mast(doc,p,false);
 sectionLabel(doc,p.data.leftLabel||'EL EQUIPO SE LLEVA',53,249,338);
 let y=278;
 for(const b of arr(p.data.bullets,4)){
  y+=bullet(doc,b,55,y,334,69,{size:13.4});
 }
 block(doc,419,247,368,274,{fill:C.pale});
 sectionLabel(doc,p.data.rightLabel||'CÓMO EVALUAMOS',440,263,332);
 let ry=302;
 for(const e of arr(p.data.evaluations,2)){
  doc.moveTo(439,ry-7).lineTo(769,ry-7).strokeColor('#DED0DA').lineWidth(.7).stroke();
  fit(doc,e.title,439,ry,323,30,{font:'bold',size:16,min:13});
  fit(doc,e.body,439,ry+35,321,64,{font:'regular',size:13,min:11});
  ry+=112;
 }
 fit(doc,p.data.note,52,523,725,27,{font:'regular',size:10,min:9,color:C.grey});
 pageno(doc,5,false);
}
function renderInvestment(doc,p){
 drawBg(doc);mast(doc,p,false);
 const d=p.data;
 block(doc,52,247,357,229,{fill:C.ink,radius:5});
 sectionLabel(doc,d.priceLabel||'INVERSIÓN PROPUESTA',76,265,310,true);
 fit(doc,d.price,76,310,308,82,{font:'bold',size:29,min:18,color:C.white});
 fit(doc,d.priceNote,76,406,308,55,{font:'regular',size:12,min:10.2,color:'#EADDE4'});
 sectionLabel(doc,d.includesLabel||'ALCANCE SUGERIDO',437,249,332);
 let y=283;
 for(const value of arr(d.includes,5)){
  y+=bullet(doc,value,436,y,335,39,{size:12.4});
 }
 doc.rect(52,490,735,3).fill(C.gold);
 sectionLabel(doc,d.nextLabel||'SIGUIENTE PASO',52,500,144);
 fit(doc,d.nextText,204,497,577,34,{font:'bold',size:13.4,min:11.2});
 fit(doc,d.note,52,530,735,20,{font:'regular',size:9.2,min:8.5,color:C.grey});
 pageno(doc,6,false);
}
function renderClose(doc,p,imgs){
 drawBg(doc,true);
 sectionLabel(doc,p.kicker,52,67,470,true);
 const t=titleText(p);
 let y=125;
 for(let i=0;i<t.length;i++){
  fit(doc,t[i],52,y,465,64,{font:'display',size:57,min:32,color:i===t.length-1?C.pink:C.white,lineGap:0});y+=64;
 }
 doc.rect(52,y+6,54,4).fill(C.gold);
 fit(doc,p.data.intro,53,286,438,57,{font:'bold',size:20,min:14,color:C.white});
 fit(doc,p.data.body,53,352,438,70,{font:'regular',size:12.8,min:10.6,color:'#EEE3EA'});
 fit(doc,p.data.cta,53,429,430,32,{font:'bold',size:13.2,min:10.4,color:C.white});
 fit(doc,p.data.contact,53,467,430,29,{font:'regular',size:11.3,min:9.1,color:C.white});
 // The portrait and signature are contained within distinct reserved regions.
 doc.save().opacity(.95).circle(667,345,118).fill(C.pink).restore();
 imageFit(doc,imgs[1],542,210,258,274);
 imageFit(doc,imgs[2],52,498,240,47);
 pageno(doc,7,true);
}
function normalizedPresentation(input){
 if(!input||typeof input!=='object'||!Array.isArray(input.slides)||input.slides.length!==7)
  throw Error('La propuesta debe contener exactamente siete páginas.');
 const company=txt(input.company,100);
 const slides=input.slides.map((p,i)=>{
  if(!p||typeof p!=='object')throw Error('Falta contenido de la página '+(i+1));
  const data=p.data||{};
  // Strictly typed schema: only approved text reaches the PDF renderer, never HTML or URLs to fetch.
  switch(i){
   case 0: return {kicker:txt(p.kicker,160),titleLines:lines(p.titleLines),data:{
    client:txt(data.client,180),description:txt(data.description,400),meta:arr(data.meta,3).map(x=>txt(x,100))}};
   case 1:return {kicker:txt(p.kicker,160),titleLines:lines(p.titleLines),data:{
    leftLabel:txt(data.leftLabel,110),lead:txt(data.lead,180),sector:txt(data.sector,200),context:txt(data.context,650),caveat:txt(data.caveat,260),
    rightLabel:txt(data.rightLabel,130),panelLead:txt(data.panelLead,440),panelBody:txt(data.panelBody,600),source:txt(data.source,320)}};
   case 2:return {kicker:txt(p.kicker,160),titleLines:lines(p.titleLines),data:{
    programs:arr(data.programs,4).map(x=>({title:txt(x?.title,140),body:txt(x?.body,430)})),note:txt(data.note,200)}};
   case 3:return {kicker:txt(p.kicker,160),titleLines:lines(p.titleLines),data:{
    specs:arr(data.specs,3).map(x=>({label:txt(x?.label,90),value:txt(x?.value,120)})),
    phases:arr(data.phases,3).map(x=>({title:txt(x?.title,90),body:txt(x?.body,420)})),note:txt(data.note,200)}};
   case 4:return {kicker:txt(p.kicker,160),titleLines:lines(p.titleLines),data:{
    leftLabel:txt(data.leftLabel,100),rightLabel:txt(data.rightLabel,100),bullets:arr(data.bullets,4).map(x=>txt(x,280)),
    evaluations:arr(data.evaluations,2).map(x=>({title:txt(x?.title,90),body:txt(x?.body,350)})),note:txt(data.note,250)}};
   case 5:return {kicker:txt(p.kicker,160),titleLines:lines(p.titleLines),data:{
    priceLabel:txt(data.priceLabel,100),price:txt(data.price,210),priceNote:txt(data.priceNote,350),
    includesLabel:txt(data.includesLabel,100),includes:arr(data.includes,5).map(x=>txt(x,230)),
    nextLabel:txt(data.nextLabel,100),nextText:txt(data.nextText,300),note:txt(data.note,300)}};
   default:return {kicker:txt(p.kicker,160),titleLines:lines(p.titleLines),data:{
    intro:txt(data.intro,200),body:txt(data.body,440),cta:txt(data.cta,240),contact:txt(data.contact,210)}};
  }
 });
 return {company,slides};
}
export async function renderPresentationPdf(input){
 const p=normalizedPresentation(input);
 const imgs=await assets();
 const doc=new PDFDocument({size:'A4',layout:'landscape',margin:0,autoFirstPage:false,compress:true,info:{
  Title:'Co.Municarse — Propuesta para '+p.company,
  Author:'Alicia Camaño · Co.Municarse',
  Subject:'Propuesta corporativa de capacitación',
  Creator:'Co.Municarse OS · servidor'
 }});
 doc.registerFont('display',FONT.display);
 doc.registerFont('regular',FONT.regular);
 doc.registerFont('bold',FONT.bold);
 const chunks=[];
 const promise=new Promise((resolve,reject)=>{
  doc.on('data',chunk=>chunks.push(chunk));
  doc.on('end',()=>resolve(Buffer.concat(chunks)));
  doc.on('error',reject);
 });
 const draw=[renderCover,renderContext,renderProgram,renderMethod,renderOutcome,renderInvestment,renderClose];
 try{
  for(let i=0;i<7;i++){
   doc.addPage({size:'A4',layout:'landscape',margin:0});
   draw[i](doc,p.slides[i],imgs);
  }
  doc.end();
  return await promise;
 }catch(e){
  doc.on('error',()=>{});
  try{doc.end()}catch{}
  throw e;
 }
}
