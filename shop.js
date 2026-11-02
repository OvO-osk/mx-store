/* M X 化妆品批发中心 · 商店页：shop.html 看全部分类货架，shop.html#perfume 进某一类（苹果官网式） */
let curCat = null, curBrand = '全部';

function brandKey(b) { return b.split(' ')[0]; }

function render() {
  const id = decodeURIComponent(location.hash.slice(1));
  const cat = catOf(id);
  if (cat !== curCat) curBrand = '全部';
  curCat = cat;
  catStrip($('#cats'), cat && cat.id);
  document.querySelectorAll('#catLinks a').forEach(a => a.classList.toggle('on', !!cat && a.dataset.cat === cat.id));
  $('#catPage').hidden = !cat;
  $('#allPage').hidden = !!cat;
  if (cat) {
    document.title = `${cat.name} · M X 化妆品批发中心`;
    const list = P.filter(p => p.cat === cat.id);
    const brands = ['全部', ...new Set(list.map(p => brandKey(p.brand)))];
    $('#cpTitle').textContent = cat.name + '。';
    $('#cpLead').textContent = cat.lead;
    $('#chips').innerHTML = brands.map(b => `<button class="chip${b === curBrand ? ' on' : ''}" data-b="${esc(b)}">${esc(b)}</button>`).join('');
    $('#chips').querySelectorAll('.chip').forEach(c => c.onclick = () => { curBrand = c.dataset.b; render(); });
    $('#grid').innerHTML = list.filter(p => curBrand === '全部' || brandKey(p.brand) === curBrand).map(cardHTML).join('');
  } else {
    document.title = '商店 · M X 化妆品批发中心';
    $('#allPage').innerHTML = CATS.map(c => {
      const list = P.filter(p => p.cat === c.id);
      if (!list.length) return '';
      return `<section class="shelf"><div class="sh-head"><h2>${c.name}。<span>${esc(c.lead)}</span></h2>
        <a class="lnk" href="#${c.id}">查看全部 ${list.length} 件 ›</a></div>
        <div class="rail">${list.map(cardHTML).join('')}</div></section>`;
    }).join('');
  }
  document.querySelectorAll('.card').forEach(c => c.onclick = () => openSheet(c.dataset.id));
}

/* 商品详情弹窗 */
let sheetP = null;
function openSheet(id) {
  sheetP = byId(id);
  mountBuy($('#sheetBuy'), sheetP, 0);
  document.body.classList.add('sheet-open');
}
const closeSheet = () => document.body.classList.remove('sheet-open');
$('#sheetX').onclick = $('#sheetBg').onclick = closeSheet;
addEventListener('keydown', e => { if (e.key === 'Escape') { closeSheet(); openCart(false); } });

onChange(bump => {
  if (sheetP && document.body.classList.contains('sheet-open')) mountBuy($('#sheetBuy'), sheetP, +($('#sheetBuy').dataset.k || 0), bump);
  // 只更新卡片上的库存文字，不重排页面
  document.querySelectorAll('.card').forEach(c => { const p = byId(c.dataset.id), n = S.stock[p.id]; c.querySelector('.p span').textContent = n === 0 ? '已售罄' : `库存 ${n} 件`; });
});
addEventListener('hashchange', () => { render(); scrollTo({ top: 0, behavior: 'smooth' }); });
render();
refresh(false);
