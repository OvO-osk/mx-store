/* M X 化妆品批发中心 · 首页（主推商品的滚动故事 + 购买区 + 分类入口）。公共部分见 common.js */
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const seg = (p, a, b) => ease(clamp((p - a) / (b - a)));
const mix = (a, b, t) => a + (b - a) * t;
const prog = el => { const r = el.getBoundingClientRect(); return clamp(-r.top / (r.height - innerHeight)); };

/* ---------- 苹果式逐帧滚动：视频拆成帧，随滚动推进（每个 .film 区块一套） ---------- */
function makeFilm(sec) {
  const N = +sec.dataset.n, dir = sec.dataset.seq, frames = [];
  const cv = sec.querySelector('.seq'), cx = cv.getContext('2d');
  const chaps = [...sec.querySelectorAll('.chap')], bar = sec.querySelector('.bar');
  let shown = -1, loaded = false;
  const load = () => {          // 进入附近才开始加载帧，首屏更快
    if (loaded) return; loaded = true;
    for (let k = 0; k < N; k++) {
      const im = new Image();
      im.src = `${dir}/f${String(k + 1).padStart(3, '0')}.jpg`;
      if (k === 0) im.onload = () => draw(0, true);
      frames.push(im);
    }
  };
  function draw(k, force) {
    if (!frames.length || (k === shown && !force)) return;
    let j = k; while (j > 0 && !(frames[j].complete && frames[j].naturalWidth)) j--;   // 没加载完就退回最近一张
    if (!(frames[j].complete && frames[j].naturalWidth)) return;
    const W = cv.width, H = cv.height, im = frames[j], s = Math.max(W / im.naturalWidth, H / im.naturalHeight);
    const w = im.naturalWidth * s, h = im.naturalHeight * s;
    cx.drawImage(im, (W - w) / 2, (H - h) * .45, w, h);                                   // 铺满（cover）
    shown = j === k ? k : -1;
  }
  function fit() {
    const r = cv.parentElement.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
    draw(shown < 0 ? 0 : shown, true);
  }
  function update() {
    const r = sec.getBoundingClientRect();
    if (r.top < innerHeight * 2.5 && r.bottom > -innerHeight) load();
    const p = prog(sec);
    draw(Math.min(N - 1, Math.floor(p * N)));
    chaps.forEach(el => {
      const a = +el.dataset.a, b = +el.dataset.b, f = .04;
      const o = Math.min(seg(p, a, a + f), 1 - seg(p, b - f, b));
      el.style.opacity = o;
      el.style.transform = `translateY(${(1 - o) * 30}px)`;
    });
    bar.style.width = p * 100 + '%';
  }
  addEventListener('resize', fit);
  fit();
  return update;
}
const films = [...document.querySelectorAll('.film')].map(makeFilm);
const bottle = $('#bottle'), big = $('#bigBottle'), bCopy = $('#bCopy');

function frame() {
  films.forEach(f => f());
  // 瓶身段：从远处转进来、放大、再收回给出规格
  const q = prog(bottle);
  const sc = mix(mix(.55, 1.12, seg(q, 0, .45)), .82, seg(q, .55, .8));
  const ry = mix(-28, 0, seg(q, 0, .45));
  const y = mix(0, -6, seg(q, .55, .8));
  big.style.transform = `translateY(${y}vh) perspective(1200px) rotateY(${ry}deg) scale(${sc})`;
  big.style.opacity = mix(.2, 1, seg(q, 0, .3));
  bCopy.style.opacity = seg(q, .6, .8);
  bCopy.style.transform = `translateY(${(1 - seg(q, .6, .8)) * 30}px)`;
}
let ticking = false;
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { frame(); ticking = false; }); } }, { passive: true });
addEventListener('resize', frame);
frame();

/* 出场动画 */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ---------- 购买区：只放首页主推的香水 ---------- */
const FEAT = P.filter(p => p.featured);
let cur = FEAT[0];
function renderPick() {
  $('#pick').innerHTML = FEAT.map(p => `<button class="${p === cur ? 'on' : ''}" data-id="${p.id}"><img src="${p.photo}" alt="">
    <span>${esc(p.brand)}<small>${esc(p.name)} · ${priceRange(p)}</small></span></button>`).join('');
  $('#pick').querySelectorAll('button').forEach(b => b.onclick = () => select(b.dataset.id));
}
function select(id, scroll) {
  cur = byId(id) || FEAT[0];
  renderPick(); mountBuy($('#buy'), cur, 0);
  if (scroll) $('#buy').scrollIntoView({ behavior: 'smooth' });
}
document.querySelectorAll('[data-pick]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); select(a.dataset.pick, true); }));
onChange(bump => { renderPick(); mountBuy($('#buy'), cur, +($('#buy').dataset.k || 0), bump); });

/* 分类入口（苹果商店式图标条） */
catStrip($('#cats'));
refresh(false);
