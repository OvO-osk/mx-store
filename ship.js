/* M X · 订单与物流的共用工具（商家后台 admin.html 和 我的订单 orders.html 共用）
   网站是纯静态的，没有服务器：商家发货后生成一条「订单链接」发给买家，订单和物流信息都编码在链接里，
   买家打开后就存进自己的「我的订单」。实时物流跳转到快递100查询。 */
window.SHIP = (function () {
  const CARRIERS = [
    ['shunfeng', '顺丰速运'], ['zhongtong', '中通快递'], ['yuantong', '圆通速递'], ['yunda', '韵达快递'],
    ['shentong', '申通快递'], ['jd', '京东物流'], ['ems', 'EMS'], ['jtexpress', '极兔速递'], ['youzhengguonei', '邮政快递包裹']
  ];
  const carrierName = c => (CARRIERS.find(x => x[0] === c) || [, c || ''])[1];
  const enc = o => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const dec = s => { try { s = s.replace(/-/g, '+').replace(/_/g, '/'); return JSON.parse(decodeURIComponent(escape(atob(s)))); } catch (e) { return null; } };
  /* 快递100 手机查询页：自动识别快递公司；顺丰需要输入收件人手机后四位 */
  const trackURL = (c, nu) => `https://m.kuaidi100.com/result.jsp?com=${encodeURIComponent(c || '')}&nu=${encodeURIComponent(nu)}`;
  const ordersURL = o => location.href.replace(/[^/]*([?#].*)?$/, '') + 'orders.html#o=' + enc(o);
  return { CARRIERS, carrierName, enc, dec, trackURL, ordersURL };
})();
