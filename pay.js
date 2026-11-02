/* M X 化妆品批发中心 · 支付宝付款（静态网站版：个人收款码 + 订单号备注，店主在支付宝账单里核对到账后发货）
   ===== 店主只需要改这里 =====
   1. 打开支付宝 → 首页「收钱」→「保存图片」，把收款码图片改名为 alipay-qr.jpg，放进 media 文件夹。
   2. （可选，手机一键跳转支付宝）用微信或任意扫码工具扫自己的收款码，会得到一串以 https://qr.alipay.com/ 开头的链接，
      填到下面 link 的引号里。不填也能用，买家扫码或长按识别即可。
   3. contact 填你的微信号或手机号，买家付款后凭订单号联系你。 */
window.PAY = {
  qr: 'media/alipay-qr.jpg',
  link: 'https://qr.alipay.com/fkx166200n0uwzmtrsngpba',
  payee: 'M X 化妆品批发中心',
  contact: '微信 xjm666777999'
};

(function () {
  const C = window.PAY;
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const OKEY = 'mx_orders_v1';
  const loadOrders = () => { try { return JSON.parse(localStorage.getItem(OKEY)) || []; } catch (e) { return []; } };
  const saveOrders = o => { try { localStorage.setItem(OKEY, JSON.stringify(o)); } catch (e) {} };
  const total = () => S.cart.reduce((a, c) => a + c.qty * (priceOf(byId(c.id), c.spec) || 0), 0);
  const newNo = () => {
    const d = new Date(), z = n => String(n).padStart(2, '0');
    return 'MX' + String(d.getFullYear()).slice(2) + z(d.getMonth() + 1) + z(d.getDate()) + z(d.getHours()) + z(d.getMinutes()) + Math.floor(Math.random() * 90 + 10);
  };
  let form = { name: '', phone: '', addr: '' }, order = null;
  try { form = Object.assign(form, JSON.parse(localStorage.getItem('mx_addr_v1')) || {}); } catch (e) {}
  let guest = null; try { guest = JSON.parse(localStorage.getItem('mx_guest_v1')); } catch (e) {}
  if (guest && !form.phone) { form.phone = guest.phone; if (!form.name) form.name = guest.name || ''; }

  document.body.insertAdjacentHTML('beforeend', `
    <div class="pay-bg" id="payBg"></div>
    <div class="pay" id="pay" role="dialog" aria-modal="true" aria-label="结算">
      <button class="sheet-x" id="payX" aria-label="关闭">✕</button>
      <div id="payBody"></div>
    </div>`);
  const body = $('#payBody');
  const open = v => document.body.classList.toggle('pay-open', v);
  $('#payX').onclick = $('#payBg').onclick = () => open(false);

  const itemsHTML = () => S.cart.map(c => {
    const p = byId(c.id), pr = priceOf(p, c.spec);
    return `<li><img src="${p.photo}" alt=""><span>${esc(p.brand)} ${esc(p.name)}<small>${esc(c.spec)} × ${c.qty}</small></span><b>¥${pr * c.qty}</b></li>`;
  }).join('');

  /* 第 1 步：核对商品 + 填收货信息 */
  function step1() {
    body.innerHTML = `
      <p class="pay-step">第 1 步 / 共 2 步</p>
      <h3>确认订单</h3>
      <ul class="pay-items">${itemsHTML()}</ul>
      <div class="pay-total"><span>合计</span><b>¥${total()}</b></div>
      <h4>收货信息</h4>
      <label>收货人<input id="fName" autocomplete="name" value="${esc(form.name)}" placeholder="姓名"></label>
      <label>手机号<input id="fPhone" type="tel" autocomplete="tel" inputmode="numeric" value="${esc(form.phone)}" placeholder="11 位手机号"></label>
      <label>收货地址<textarea id="fAddr" rows="2" autocomplete="street-address" placeholder="省 市 区 街道 门牌号">${esc(form.addr)}</textarea></label>
      <button class="btn wide alipay-btn" id="toPay">${aliLogo()}支付宝付款 ¥${total()}</button>`;
    $('#toPay').onclick = () => {
      form = { name: $('#fName').value.trim(), phone: $('#fPhone').value.trim(), addr: $('#fAddr').value.trim() };
      if (!form.name) return say('请填写收货人');
      if (!/^1\d{10}$/.test(form.phone)) return say('请填写正确的 11 位手机号');
      if (form.addr.length < 6) return say('请填写完整的收货地址');
      try { localStorage.setItem('mx_addr_v1', JSON.stringify(form)); } catch (e) {}
      order = { no: newNo(), time: new Date().toLocaleString('zh-CN'), amount: total(), items: S.cart.map(c => ({ ...c, price: priceOf(byId(c.id), c.spec) })), ...form, status: '待确认到账' };
      step2();
    };
  }

  /* 第 2 步：扫码付款，备注订单号 */
  function step2() {
    const jump = C.link ? 'alipays://platformapi/startapp?saId=10000007&qrcode=' + encodeURIComponent(C.link) : '';
    body.innerHTML = `
      <p class="pay-step">第 2 步 / 共 2 步</p>
      <h3>${aliLogo()}支付宝付款</h3>
      <div class="pay-amt">¥<b>${order.amount}</b></div>
      <p class="pay-no">订单号 <b id="oNo">${order.no}</b> <button class="pay-copy" id="cpNo">复制</button></p>
      <div class="pay-qr">
        <img src="${C.qr}" alt="支付宝收款码" id="qrImg">
        <p class="qr-miss" hidden>店主还没上传收款码（media/alipay-qr.jpg），请联系客服付款</p>
      </div>
      <ol class="pay-how">
        <li>${isMobile ? (jump ? '点下方按钮直接打开支付宝，或长按收款码保存后，在支付宝「扫一扫」→ 右上角「相册」里选它' : '长按收款码保存图片，打开支付宝「扫一扫」→ 右上角「相册」选这张图') : '打开手机支付宝，点「扫一扫」扫上面的收款码'}</li>
        <li>金额输入 <b>¥${order.amount}</b></li>
        <li>点「添加备注」，填订单号 <b>${order.no}</b>，确认付款</li>
      </ol>
      ${jump ? `<a class="btn wide alipay-btn" href="${jump}">${aliLogo()}打开支付宝付款</a>` : ''}
      <button class="btn wide ghost" id="paid">我已付款</button>
      <button class="pay-back" id="back">← 返回修改订单</button>`;
    const img = $('#qrImg');
    img.onerror = () => { img.hidden = true; body.querySelector('.qr-miss').hidden = false; };
    $('#cpNo').onclick = () => copy(order.no, '订单号已复制，付款时粘贴到备注里');
    $('#back').onclick = step1;
    $('#paid').onclick = () => {
      const all = loadOrders(); all.unshift(order); saveOrders(all);
      try { if (!localStorage.getItem('mx_guest_v1')) localStorage.setItem('mx_guest_v1', JSON.stringify({ phone: order.phone, name: order.name })); } catch (e) {}
      S.cart = []; refresh(false);
      step3();
    };
  }

  /* 第 3 步：提交成功，买家把订单信息发给店主 */
  function step3() {
    const text = `【M X 订单】${order.no}\n金额：¥${order.amount}（支付宝已付）\n` +
      order.items.map(it => { const p = byId(it.id); return `· ${p.brand} ${p.name} ${it.spec} × ${it.qty}`; }).join('\n') +
      `\n收货人：${order.name} ${order.phone}\n地址：${order.addr}`;
    body.innerHTML = `
      <div class="pay-done">
        <div class="tick">✓</div>
        <h3>订单已提交</h3>
        <p>订单号 <b>${order.no}</b> · ¥${order.amount}</p>
        <p class="mute">店主在支付宝核对到账（金额 + 备注订单号）后安排发货。${C.contact ? `<br>有问题请联系：<b>${esc(C.contact)}</b>` : ''}</p>
        <pre class="pay-text">${esc(text)}</pre>
        <button class="btn wide" id="cpAll">复制订单信息，发给店主</button>
        <a class="btn wide ghost" href="orders.html">查看我的订单</a>
        <button class="pay-back" id="done">完成</button>
      </div>`;
    $('#cpAll').onclick = () => copy(text, '订单信息已复制');
    $('#done').onclick = () => open(false);
  }

  function copy(t, msg) {
    const ok = () => say(msg);
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(ok, () => fallback(t, ok));
    else fallback(t, ok);
  }
  function fallback(t, ok) {
    const ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); ok(); } catch (e) { say('复制失败，请手动长按复制'); }
    ta.remove();
  }
  function aliLogo() {
    return '<i class="ali" aria-hidden="true">支</i>';
  }

  $('#checkout').onclick = () => {
    if (!S.cart.length) return say('购物车是空的');
    openCart(false); step1(); open(true);
  };
})();
