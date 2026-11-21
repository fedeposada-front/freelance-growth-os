import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/discover.js';

function response(){
  return {code:200,headers:{},body:null,setHeader(k,v){this.headers[k]=v;return this},status(n){this.code=n;return this},json(x){this.body=x;return this}};
}
async function withFetch(mock,fn){
  const original=globalThis.fetch;
  globalThis.fetch=mock;
  try{await fn()}finally{globalThis.fetch=original}
}

test('discovery returns sourced OSM records, no fabricated company',async()=>{
  await withFetch(async (url,opts)=>{
    assert.equal(url,'https://overpass-api.de/api/interpreter');
    assert.equal(opts.method,'POST');
    assert.match(String(opts.body),/data=/);
    return {ok:true,json:async()=>({elements:[
      {type:'node',id:123,tags:{name:'Cochería Ejemplo',website:'https://ejemplo.com',email:'contacto@ejemplo.com','addr:city':'Morón'}},
      {type:'way',id:456,tags:{name:'Sin web',website:'http://no-https.example'}},
      {type:'node',id:789,tags:{shop:'funeral_directors'}}
    ]})};
  },async()=>{
    const res=response();
    await handler({method:'GET',query:{zone:'amba',sector:'funeral'}},res);
    assert.equal(res.code,200);
    assert.equal(res.body.companies.length,2);
    assert.equal(res.body.companies[0].sourceUrl,'https://www.openstreetmap.org/node/123');
    assert.equal(res.body.companies[0].website,'https://ejemplo.com/');
    assert.equal(res.body.companies[1].website,'');
    assert.match(res.body.warning,/confirmar/i);
    assert.match(res.body.license,/ODbL/);
  });
});

test('discovery refuses unsupported methods without network call',async()=>{
  await withFetch(async()=>{throw Error('fetch should not run')},async()=>{
    const res=response();
    await handler({method:'POST',query:{}},res);
    assert.equal(res.code,405);
  });
});

test('discovery handles unavailable source without invented results',async()=>{
  await withFetch(async()=>({ok:false,status:429}),async()=>{
    const res=response();
    await handler({method:'GET',query:{zone:'caba',sector:'funeral'}},res);
    assert.equal(res.code,503);
    assert.match(res.body.error,/429/);
    assert.equal(res.body.companies,undefined);
  });
});

test('discovery sanitizes public text and invalid website',async()=>{
  await withFetch(async()=>({ok:true,json:async()=>({elements:[{type:'node',id:3,tags:{name:'A\\nB',website:'javascript:alert(1)',email:'x\\ny'}}]})}),async()=>{
    const res=response();
    await handler({method:'GET',query:{}},res);
    assert.equal(res.code,200);
    assert.equal(res.body.companies[0].website,'');
    assert.equal(res.body.companies[0].name,'A B');
  });
});

test('discovery rejects malformed OSM elements and deduplicates IDs',async()=>{
  await withFetch(async()=>({ok:true,json:async()=>({elements:[
    null,{type:'node',id:42,tags:{name:'Empresa única'}},
    {type:'node',id:42,tags:{name:'Duplicada'}},
    {type:'way',id:-1,tags:{name:'ID inválido'}},
    {type:'script',id:44,tags:{name:'Tipo inválido'}},
    {type:'way',id:45,tags:{name:'  '}},
    {type:'way',id:46,tags:{name:'Empresa válida'}}
  ]})}),async()=>{
    const res=response();
    await handler({method:'GET',query:{zone:'amba',sector:'funeral'}},res);
    assert.equal(res.code,200);
    assert.deepEqual(res.body.companies.map(x=>x.name),['Empresa única','Empresa válida']);
  });
});

test('discovery handles unexpected Overpass JSON without fabricating records',async()=>{
  await withFetch(async()=>({ok:true,json:async()=>({elements:{unexpected:'object'}})}),async()=>{
    const res=response();
    await handler({method:'GET',query:{}},res);
    assert.equal(res.code,200);
    assert.deepEqual(res.body.companies,[]);
  });
});
