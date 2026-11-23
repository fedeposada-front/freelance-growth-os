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
  await withFetch(async()=>({ok:true,json:async()=>({elements:[{type:'node',id:3,tags:{name:'A'+String.fromCharCode(10)+'B',website:'javascript:alert(1)',email:'x'+String.fromCharCode(10)+'y'}}]})}),async()=>{
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

test('discovery rejects unexpected Overpass JSON without fabricating records',async()=>{
  await withFetch(async()=>({ok:true,json:async()=>({elements:{unexpected:'object'}})}),async()=>{
    const res=response();
    await handler({method:'GET',query:{}},res);
    assert.equal(res.code,503);
    assert.match(res.body.error,/Overpass/);
    assert.equal(res.body.companies,undefined);
  });
});

test('discovery rejects Overpass remark despite HTTP 200',async()=>{
  await withFetch(async()=>({ok:true,json:async()=>({elements:[],remark:'runtime error: timeout'})}),async()=>{
    const res=response();
    await handler({method:'GET',query:{zone:'caba',sector:'funeral'}},res);
    assert.equal(res.code,503);
    assert.equal(res.body.companies,undefined);
  });
});

test('discovery accepts genuinely empty Overpass results',async()=>{
  await withFetch(async()=>({ok:true,json:async()=>({elements:[]})}),async()=>{
    const res=response();
    await handler({method:'GET',query:{zone:'caba',sector:'funeral'}},res);
    assert.equal(res.code,200);
    assert.deepEqual(res.body.companies,[]);
  });
});


test('discovery rejects unsupported zone and sector before network access',async()=>{
  await withFetch(async()=>{throw Error('fetch must not run')},async()=>{
    for(const query of [{zone:'unknown',sector:'funeral'},{zone:'caba',sector:'unknown'},{zone:['amba'],sector:'funeral'}]){
      const res=response();
      await handler({method:'GET',query},res);
      assert.equal(res.code,400);
      assert.match(res.body.error,/Zona o rubro/);
      assert.ok(res.body.allowedZones.includes('amba'));
    }
  });
});

test('discovery ignores non-string OSM contacts and credentialed HTTPS URLs',async()=>{
  await withFetch(async()=>({ok:true,json:async()=>({elements:[
    {type:'node',id:901,tags:{name:'Empresa',website:'https://user:pass@example.com',email:{unexpected:true},phone:['123'],'addr:city':{bad:true}}},
    {type:'node',id:902,tags:{name:'Empresa 2',website:['https://example.com'],email:'contacto@example.com','addr:city':'Morón'}}
  ]})}),async()=>{
    const res=response();
    await handler({method:'GET',query:{zone:'caba',sector:'funeral'}},res);
    assert.equal(res.code,200);
    assert.equal(res.body.companies[0].website,'');
    assert.equal(res.body.companies[0].email,'');
    assert.equal(res.body.companies[0].phone,'');
    assert.equal(res.body.companies[0].city,'');
    assert.equal(res.body.companies[1].website,'');
    // Only address tags establish a locality; search bounding boxes are not addresses.
    assert.equal(res.body.companies[1].email,'contacto@example.com');
    assert.equal(res.body.companies[1].city,'Morón');
  });
});


test('discovery retries alternate public Overpass endpoint after primary 503',async()=>{
  const urls=[];
  await withFetch(async(url)=>{
    urls.push(url);
    if(urls.length===1)return {ok:false,status:503};
    return {ok:true,json:async()=>({elements:[{type:'node',id:77,tags:{name:'Funeraria verificable'}}]})};
  },async()=>{
    const res=response();
    await handler({method:'GET',query:{zone:'caba',sector:'funeral'}},res);
    assert.equal(res.code,200);
    assert.equal(res.body.companies[0].osmId,'node/77');
    assert.equal(res.body.providerUrl,'https://overpass.kumi.systems/api/interpreter');
    assert.deepEqual(urls,['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter']);
  });
});

test('discovery never fabricates results when both providers fail',async()=>{
  let calls=0;
  await withFetch(async()=>{calls++;return {ok:false,status:503}},async()=>{
    const res=response();
    await handler({method:'GET',query:{}},res);
    assert.equal(res.code,503);
    assert.equal(calls,2);
    assert.equal(res.body.companies,undefined);
  });
});


test('discovery exposes a safe deployment revision header for remote QA',async()=>{
  await withFetch(async()=>({ok:true,json:async()=>({elements:[]})}),async()=>{
    const res=response();
    await handler({method:'GET',query:{}},res);
    assert.equal(res.code,200);
    assert.match(res.headers['X-App-Revision'],/^(unknown|[a-f0-9]{40})$/i);
    assert.equal(res.headers['Cache-Control'],'no-store');
  });
});

test('discovery prefers valid HTTPS contact website when primary website is invalid',async()=>{
  await withFetch(async()=>({ok:true,json:async()=>({elements:[
    {type:'node',id:911,tags:{name:'Funeraria ejemplo',website:'http://inseguro.example','contact:website':'https://seguro.example/contacto'}},
    {type:'node',id:912,tags:{name:'Funeraria ejemplo 2',website:'https://principal.example','contact:website':'https://secundario.example'}}
  ]})}),async()=>{
    const res=response();
    await handler({method:'GET',query:{zone:'caba',sector:'funeral'}},res);
    assert.equal(res.code,200);
    assert.equal(res.body.companies[0].website,'https://seguro.example/contacto');
    assert.equal(res.body.companies[1].website,'https://principal.example/');
  });
});


test('discovery excludes names made only of control characters after sanitization',async()=>{
  await withFetch(async()=>({ok:true,json:async()=>({elements:[
    {type:'node',id:951,tags:{name:String.fromCharCode(10,13,9)}},
    {type:'node',id:952,tags:{name:'Funeraria real'}}
  ]})}),async()=>{
    const res=response();
    await handler({method:'GET',query:{zone:'caba',sector:'funeral'}},res);
    assert.equal(res.code,200);
    assert.deepEqual(res.body.companies.map(x=>x.name),['Funeraria real']);
  });
});

test('discovery falls back to legitimate public contact tags after malformed primary values',async()=>{
  await withFetch(async()=>({ok:true,json:async()=>({elements:[
    {type:'node',id:961,tags:{name:'Empresa A',email:{bad:true},'contact:email':'publico@example.com',phone:['bad'],'contact:phone':'+54 11 1234 5678'}},
    {type:'node',id:962,tags:{name:'Empresa B',email:'principal@example.com','contact:email':'alterno@example.com',phone:'1234','contact:phone':'5678'}}
  ]})}),async()=>{
    const res=response();
    await handler({method:'GET',query:{zone:'caba',sector:'funeral'}},res);
    assert.equal(res.code,200);
    assert.equal(res.body.companies[0].email,'publico@example.com');
    assert.equal(res.body.companies[0].phone,'+54 11 1234 5678');
    assert.equal(res.body.companies[1].email,'principal@example.com');
    assert.equal(res.body.companies[1].phone,'1234');
  });
});
