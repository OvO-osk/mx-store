/* M X 化妆品批发中心 · 公共部分：导航分类、库存、购物车、提示（首页和分类页共用） */
const $ = s => document.querySelector(s);
const P = window.PRODUCTS, CATS = window.CATS;
const byId = id => P.find(p => p.id === id);
const catOf = id => CATS.find(c => c.id === id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = v => v == null ? '价格待定' : '¥' + v;
const priceOf = (p, spec) => (p.specs.find(s => s.label === spec) || p.specs[0]).price;
const priceRange = p => {
  const v = p.specs.map(s => s.price).filter(x => x != null);
  if (!v.length) return '价格待定';
  const lo = Math.min(...v), hi = Math.max(...v);
  return lo === hi ? `¥${lo}` : `¥${lo} 起`;
};

/* 导航：每个分类一个入口（苹果官网式） */
(function nav() {
  const ul = $('#catLinks');
  if (ul) ul.innerHTML = CATS.map(c => `<li><a href="shop.html#${c.id}" data-cat="${c.id}">${c.name}</a></li>`).join('');
  const mb = $('#menuBtn');
  if (mb) mb.onclick = () => document.body.classList.toggle('menu-open');
  document.querySelectorAll('#catLinks a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu-open')));
})();

/* 分类图标条：每类取第一件商品的图 */
function catStrip(el, active) {
  el.innerHTML = CATS.map(c => {
    const first = P.find(p => p.cat === c.id);
    const n = P.filter(p => p.cat === c.id).length;
    return `<a class="cs${c.id === active ? ' on' : ''}" href="shop.html#${c.id}" data-cat="${c.id}">
      <span class="ci-img"><img src="${first ? first.photo : ''}" alt="" loading="lazy"></span>
      <b>${c.name}</b><small>${n} 件</small></a>`;
  }).join('');
}

/* ---------- 库存与购物车（测试版：存在本机浏览器） ---------- */
const KEY = 'mx_store_v2';
let S;
try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
if (!S || !S.stock) S = { stock: {}, cart: [] };
P.forEach(p => { if (S.stock[p.id] == null) S.stock[p.id] = p.stock; });
S.cart = S.cart.filter(c => byId(c.id));
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

const toast = $('#toast'); let tt;
const say = m => { toast.textContent = m; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 2200); };

const listeners = [];
const onChange = f => listeners.push(f);
function refresh(bump) { save(); renderCart(); listeners.forEach(f => f(bump)); }

function addToCart(p, spec) {
  if (priceOf(p, spec) == null) return say('这个商品价格待定，请联系客服');
  if (S.stock[p.id] <= 0) return say('已售罄');
  S.stock[p.id]--;
  const line = S.cart.find(c => c.id === p.id && c.spec === spec);
  line ? line.qty++ : S.cart.push({ id: p.id, spec, qty: 1 });
  refresh(true);
  say(`已加入购物车：${p.name} ${spec}，库存剩 ${S.stock[p.id]} 件`);
}
function change(k, d) {
  const c = S.cart[k];
  if (d > 0) { if (S.stock[c.id] <= 0) return say('库存不足'); S.stock[c.id]--; c.qty++; }
  else { S.stock[c.id]++; c.qty--; if (!c.qty) S.cart.splice(k, 1); }
  refresh(false);
}
function renderCart() {
  const n = S.cart.reduce((a, c) => a + c.qty, 0);
  $('#bagN').textContent = n; $('#bagN').classList.toggle('show', n > 0);
  $('#cartList').innerHTML = S.cart.length ? S.cart.map((c, k) => {
    const p = byId(c.id);
    return `<div class="ci"><div class="th"><img src="${p.photo}" alt=""></div>
      <div class="nm">${esc(p.brand)} ${esc(p.name)}<small>${esc(c.spec)} · ${money(priceOf(p, c.spec))}</small></div>
      <div class="qty"><button data-k="${k}" data-d="-1">−</button>${c.qty}<button data-k="${k}" data-d="1" ${S.stock[c.id] === 0 ? 'disabled' : ''}>+</button></div></div>`;
  }).join('') : '<p class="empty">购物车是空的</p>';
  $('#cartList').querySelectorAll('.qty button').forEach(b => b.onclick = () => change(+b.dataset.k, +b.dataset.d));
  $('#sum').textContent = '¥' + S.cart.reduce((a, c) => a + c.qty * (priceOf(byId(c.id), c.spec) || 0), 0);
}
const openCart = v => document.body.classList.toggle('cart-open', v);
$('#bagBtn').onclick = () => openCart(true);
$('#closeCart').onclick = $('#scrim').onclick = () => openCart(false);
$('#checkout').onclick = () => say(S.cart.length ? '测试版暂未开通在线支付' : '购物车是空的');

/* 商品详情（规格 / 价格 / 库存 / 加购），首页购买区和分类页弹窗共用 */
function buyHTML(p, k) {
  const n = S.stock[p.id], sp = p.specs[k];
  const cls = n === 0 ? 'out' : n <= 3 ? 'low' : '';
  const na = sp.price == null;
  return `
    <div class="pimg"><img src="${p.photo}" alt="${esc(p.name)}"></div>
    <div class="pinfo">
      <p class="brand">${esc(p.brand)}</p>
      <h2>${esc(p.name)}</h2>
      <p class="sub">${esc(p.type)}${p.notes ? '<br>' + esc(p.notes) : ''}</p>
      <p class="price">${money(sp.price)}</p>
      <div class="row"><h4>规格</h4><div class="opts">${p.specs.map((s, j) =>
        `<button class="opt${j === k ? ' on' : ''}" data-k="${j}">${esc(s.label)}<small>${money(s.price)}</small></button>`).join('')}</div></div>
      <div class="row"><div class="stock ${cls}"><span>${n === 0 ? '已售罄' : `库存 <b class="stockN">${n}</b> 件`}</span><span class="meter"><i style="width:${n / p.stock * 100}%"></i></span></div></div>
      <button class="btn addBtn" ${n === 0 || na ? 'disabled' : ''}>${n === 0 ? '已售罄' : na ? '价格待定' : '加入购物车'}</button>
      <p class="full">${esc(p.full)}</p>
    </div>`;
}
function mountBuy(el, p, k, bump) {
  el.innerHTML = buyHTML(p, k);
  el.querySelectorAll('.opt').forEach(b => b.onclick = () => mountBuy(el, p, +b.dataset.k));
  el.querySelector('.addBtn').onclick = () => addToCart(p, p.specs[k].label);
  if (bump && el.querySelector('.stockN')) el.querySelector('.stockN').classList.add('bump');
  el.dataset.id = p.id; el.dataset.k = k;
}
function specSummary(p) {
  const sized = p.specs.every(s => /\d\s*(ml|g)\b/i.test(s.label));
  if (sized && p.specs.length <= 5) return p.specs.map(s => esc(s.label)).join(' / ');
  return p.specs.length > 1 ? `${p.specs.length} 个${sized ? '规格' : '色号'}可选` : esc(p.specs[0].label);
}
function cardHTML(p) {
  const n = S.stock[p.id];
  return `<div class="card" data-id="${p.id}"><div class="thumb"><img src="${p.photo}" alt="${esc(p.name)}" loading="lazy"></div>
    <p class="cb">${esc(p.brand)}</p><h5>${esc(p.name)}</h5><p class="m">${specSummary(p)}</p>
    <div class="p">${priceRange(p)}<span>${n === 0 ? '已售罄' : `库存 ${n} 件`}</span></div></div>`;
}
