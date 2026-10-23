import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const script=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
const element=()=>({innerHTML:'',querySelector:()=>({addEventListener(){},removeAttribute(){},style:{}})});
const ctx=vm.createContext({URL,Date,document:{getElementById:element,createElement:element},localStorage:{getItem:()=>null}});
vm.runInContext(script.slice(0,script.indexOf('document.getElementById("formBusca").addEventListener')),ctx);
const name=vm.runInContext('nomeLoja',ctx),card=vm.runInContext('criarCard',ctx),active=vm.runInContext('ofertaAtiva',ctx);
test('cinco lojas têm filtros e são identificadas pelo domínio real, acima da marca informada',()=>{
  for(const [store,domain] of [['Netshoes','netshoes.com.br'],['Mizuno','mizuno.com.br'],['Nike','nike.com.br'],['AliExpress','s.click.aliexpress.com'],['SHEIN','onelink.shein.com']]){
    assert.ok(html.includes(`data-loja="${store}"`));
    assert.equal(name('Nike Mizuno',{link:`https://${domain}/produto`}),store);
    assert.equal(active({loja:store,link:`https://${domain}/produto`,timestamp:Date.now()-1000},Date.now()),true);
    assert.equal(name('',{link:`https://${domain}.example.test/produto`}), 'Loja');
  }
  assert.equal(name('Ali Express',{}),'AliExpress');
  assert.equal(name('Nike',{link:'https://www.netshoes.com.br/p/tenis-nike'}),'Netshoes');
});
test('botão e URL visível usam o mesmo endereço completo e preservam atribuição com escape HTML',()=>{
  const link='https://www.awin1.com/cread.php?awinmid=123&ued=https%3A%2F%2Fwww.nike.com.br%2Fp&clickref=Junao%2Fsite&extra="<teste>"';
  const rendered=card({titulo:'Teste local',loja:'Nike',link,precoPor:'R$ 50,00',timestamp:Date.now()-1000}).innerHTML;
  const escaped=new URL(link).href.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  assert.equal(rendered.split(`href="${escaped}"`).length-1,2);
  assert.ok(rendered.includes(`>${escaped}</a>`));
  assert.ok(rendered.includes('rel="sponsored noopener noreferrer"'));
  assert.ok(!rendered.includes('<teste>'));
  assert.ok(!card({titulo:'Inválido',link:'javascript:alert(1)',timestamp:Date.now()}).innerHTML.includes('class="endereco-oferta"'));
});
test('Amazon permanece bloqueada mesmo com tag atual e reconhecimento dos novos intermediários',()=>{
  assert.equal(active({loja:'Amazon',link:'https://www.amazon.com.br/dp/B000000000?tag=junaopromobr-20',timestamp:Date.now()-1000},Date.now()),false);
});

