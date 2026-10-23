import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const script=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
const element=()=>({innerHTML:'',querySelector:()=>({addEventListener(){},removeAttribute(){},style:{}})});
const ctx=vm.createContext({URL,Date,document:{getElementById:element,createElement:element},localStorage:{getItem:()=>null}});
vm.runInContext(script.slice(0,script.indexOf('document.getElementById("formBusca").addEventListener')),ctx);
const {ofertaAtiva:active,criarCard:card,CONFIG:cfg}=vm.runInContext('({ofertaAtiva,criarCard,CONFIG})',ctx);
const now=Date.now(),long='https://www.amazon.com.br/dp/B000000001?tag=junaopromobr-20',short='https://link.amazon/TESTELOCAL';
const item={titulo:'Produto local',loja:'Amazon',link:long,linkWhatsapp:long,timestamp:now-60000,expiresAt:now+3600000,precoPor:'R$ 50,00',condicoes:'Use o cupom TESTELOCAL',imagem:'https://example.test/foto-enviada.jpg'};
test('retomada ativa exibe foto, preço, horário e link original',()=>{
  assert.equal(active(item,now),true);
  const rendered=card(item).innerHTML;
  for(const expected of [item.imagem,item.precoPor,item.condicoes,'Preço informado em','(Brasília)','Ver na Amazon','Link da oferta:']) assert.ok(rendered.includes(expected));
  assert.equal(rendered.split(`href="${long}"`).length-1,2);
});
test('link curto só passa com registro do mesmo endereço e destino do ID atual',()=>{
  const current={...item,link:short,linkWhatsapp:short,amazonTracking:{url:short,destination:long,associateTag:'junaopromobr-20'}};
  assert.equal(active(current,now),true);
  assert.ok(card(current).innerHTML.includes(`>${short}</a>`));
  for(const amazonTracking of [undefined,{...current.amazonTracking,url:'https://link.amazon/OUTRO'},
    {...current.amazonTracking,associateTag:'antigo-20'},{...current.amazonTracking,destination:long.replace('junaopromobr-20','antigo-20')},
    {...current.amazonTracking,destination:'https://amazon.com.br.evil.test/?tag=junaopromobr-20'}]) assert.equal(active({...current,amazonTracking},now),false);
});
test('tags antigas/duplicadas, origem enganosa e botão com endereço divergente não entram',()=>{
  for(const link of [long.replace('junaopromobr-20','junaopromoc03-20'),long+'&tag=outro-20',long.split('?')[0],
    long.replace('https:','http:'),long.replace('www.amazon','usuario@www.amazon'),long.replace('amazon.com.br','amazon.com.br.evil.test')]) assert.equal(active({...item,link,linkWhatsapp:link},now),false);
  assert.equal(active({...item,linkWhatsapp:'https://evil.test/'},now),false);
});
test('Amazon não ganha prazo novo nem reaparece vencida ou com data futura',()=>{
  assert.equal(active({...item,timestamp:now-86400000},now),false);
  assert.equal(active({...item,expiresAt:now-1},now),false);
  assert.equal(active({...item,timestamp:now+1},now),false);
  cfg.amazonPausada=true; assert.equal(active(item,now),false);cfg.amazonPausada=false;
});
