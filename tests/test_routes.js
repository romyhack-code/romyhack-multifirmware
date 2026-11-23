/* Test sin dependencias para el router de la portada. Ejecutar: node tests/test_routes.js */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const source = fs.readFileSync(path.join(__dirname, '..', 'assets', 'app.js'), 'utf8');
function element() {
  const attrs = {};
  return {
    className: 'action-btn disabled', textContent: '', style: {display: 'none'},
    getAttribute(k) { return attrs[k]; }, setAttribute(k,v) { attrs[k] = v; },
    removeAttribute(k) { delete attrs[k]; }
  };
}
function test(ua) {
  const names=['deviceValue','fwValue','detectionHint','engineName','engineMeta','engineStatus','warning','launchBtn','cacheBtn','actionInfo'];
  const els = Object.fromEntries(names.map(x=>[x,element()]));
  const fw=['5.05','7.00','9.00','10.00','11.50','12.00','14.00','14.02'];
  const btns=fw.map(n=>{const b=element();b.className='fw-btn';b.setAttribute('data-fw',n);return b;});
  els.launchBtn.setAttribute('aria-disabled','true');
  els.cacheBtn.setAttribute('aria-disabled','true');
  const document={getElementById(n){return els[n];},querySelectorAll(){return btns;}};
  vm.runInNewContext(source,{document,navigator:{userAgent:ua}});
  return {els,btns};
}
const assert=require('assert');
const fourteen=test('Mozilla/5.0 (PlayStation 4 14.00) AppleWebKit/605.1.15');
assert.equal(fourteen.els.engineName.textContent,'MPS · ROMYHACK 14.00');
assert.equal(fourteen.els.launchBtn.getAttribute('href'),'hosts/mps14/index.html');
assert.equal(fourteen.els.cacheBtn.getAttribute('href'),'hosts/mps14/cache.html');
const two=test('Mozilla/5.0 (PlayStation 4 14.02) AppleWebKit/605.1.15');
assert.equal(two.els.launchBtn.getAttribute('href'),'hosts/g2all/index.html');
assert.equal(two.els.cacheBtn.getAttribute('href'),'hosts/g2all/cacheslopkit.html');
assert.equal(two.els.warning.style.display,'block');
const desktop=test('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit');
assert.equal(desktop.els.launchBtn.getAttribute('aria-disabled'),'true');
desktop.btns[2].onclick();
assert.equal(desktop.els.cacheBtn.getAttribute('href'),'hosts/g2all/cache900.html');
const unknown=test('Mozilla/5.0 (PlayStation 4 15.00) AppleWebKit');
assert.equal(unknown.els.launchBtn.getAttribute('aria-disabled'),'true');
console.log('OK: 14.00, 14.02, seleccion manual, firmware no soportado.');
