// NEVOA — o vidro embaciado da capa (proposta C). Por cima da fotografia verdadeira do letreiro, um canvas com a
// mesma imagem desfocada e uma névoa clara; o dedo (ou o rato) limpa o vidro e, parado algum tempo, a névoa volta.
// Ao abrir, um «puxador» limpa uma faixa sozinho, para se perceber o gesto. Com «reduzir movimento»: só a fotografia.
(() => {
  const caixa = document.querySelector('[data-vidro]');
  if (!caixa) return;
  const img = caixa.querySelector('img');
  const tela = caixa.querySelector('canvas');
  const reduzir = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduzir.matches || !tela.getContext) { caixa.classList.add('parado'); tela.remove(); return; }

  const c = tela.getContext('2d');
  const nevoa = document.createElement('canvas');
  const mascara = document.createElement('canvas');
  let W = 0, H = 0, dpr = 1, pronto = false;
  let ultimoToque = 0, id = 0, varrer = null;
  const FOCO_Y = 0.46;

  const cobrir = (iw, ih, w, h) => { const s = Math.max(w / iw, h / ih); const dw = iw * s, dh = ih * s; return [(w - dw) / 2, (h - dh) * FOCO_Y, dw, dh]; };

  // pseudo-aleatório com semente: as gotas ficam sempre no mesmo sítio
  let semente = 7;
  const aleatorio = () => { semente = (semente * 16807) % 2147483647; return (semente - 1) / 2147483646; };

  function pintarNevoa() {
    const n = nevoa.getContext('2d');
    n.clearRect(0, 0, W, H);
    // desfocar: reduzir em dois passos e voltar a esticar (funciona em todos os browsers, mesmo sem ctx.filter)
    const a = document.createElement('canvas'), b = document.createElement('canvas');
    a.width = Math.max(16, Math.round(W / 4)); a.height = Math.max(16, Math.round(H / 4));
    b.width = Math.max(8, Math.round(W / 16)); b.height = Math.max(8, Math.round(H / 16));
    const ac = a.getContext('2d'), bc = b.getContext('2d');
    ac.imageSmoothingQuality = 'high'; bc.imageSmoothingQuality = 'high'; n.imageSmoothingQuality = 'high';
    ac.drawImage(img, ...cobrir(img.naturalWidth, img.naturalHeight, a.width, a.height));
    bc.drawImage(a, 0, 0, b.width, b.height);
    n.drawImage(b, 0, 0, W, H);
    // a névoa: um véu claro, mais denso em baixo, e um brilho na diagonal
    const g = n.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(244, 238, 228, .52)');
    g.addColorStop(1, 'rgba(236, 228, 214, .66)');
    n.fillStyle = g; n.fillRect(0, 0, W, H);
    const brilho = n.createLinearGradient(0, 0, W, H);
    brilho.addColorStop(0.25, 'rgba(255, 255, 255, 0)'); brilho.addColorStop(0.42, 'rgba(255, 255, 255, .16)'); brilho.addColorStop(0.55, 'rgba(255, 255, 255, 0)');
    n.fillStyle = brilho; n.fillRect(0, 0, W, H);
    // gotas de condensação
    semente = 7;
    const total = Math.round((W * H) / (5200 * dpr * dpr));
    for (let i = 0; i < total; i++) {
      const x = aleatorio() * W, y = aleatorio() * H, r = (0.6 + aleatorio() * aleatorio() * 3.2) * dpr;
      n.beginPath(); n.arc(x, y, r, 0, Math.PI * 2);
      n.fillStyle = `rgba(255, 255, 255, ${0.18 + aleatorio() * 0.3})`; n.fill();
      n.beginPath(); n.arc(x + r * 0.25, y + r * 0.3, r * 0.75, 0, Math.PI * 2);
      n.fillStyle = 'rgba(90, 70, 45, .10)'; n.fill();
    }
  }

  function medir() {
    const q = caixa.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const nw = Math.round(q.width * dpr), nh = Math.round(q.height * dpr);
    if (nw === W && nh === H) return;
    W = nw; H = nh;
    for (const t of [tela, nevoa, mascara]) { t.width = W; t.height = H; }
    pintarNevoa();
    compor();
  }

  function compor() {
    c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, W, H);
    c.drawImage(nevoa, 0, 0);
    c.globalCompositeOperation = 'destination-out';
    c.drawImage(mascara, 0, 0);
    c.globalCompositeOperation = 'source-over';
  }

  function limpar(x0, y0, x1, y1) {
    const m = mascara.getContext('2d');
    const raio = Math.max(W, H) * 0.07;
    const passos = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (raio * 0.25)));
    for (let i = 0; i <= passos; i++) {
      const t = i / passos, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      const g = m.createRadialGradient(x, y, 0, x, y, raio);
      g.addColorStop(0, 'rgba(0, 0, 0, 1)'); g.addColorStop(0.6, 'rgba(0, 0, 0, .85)'); g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      m.fillStyle = g; m.beginPath(); m.arc(x, y, raio, 0, Math.PI * 2); m.fill();
    }
    ultimoToque = performance.now();
  }

  // a névoa volta: depois de 4 s parado, a máscara vai-se apagando; ao fim, limpa-se de vez
  function voltarNevoa(agora) {
    const parado = agora - ultimoToque;
    if (parado < 4000) return true;
    const m = mascara.getContext('2d');
    m.globalCompositeOperation = 'destination-out';
    m.fillStyle = 'rgba(0, 0, 0, .03)';
    m.fillRect(0, 0, W, H);
    m.globalCompositeOperation = 'source-over';
    if (parado > 8000) { m.clearRect(0, 0, W, H); return false; }
    return true;
  }

  function ciclo(agora) {
    id = 0;
    let continuar = false;
    if (varrer) {
      const t = Math.min(1, (agora - varrer.t0) / varrer.dur);
      const k = 1 - Math.pow(1 - t, 3);
      const ponto = (s) => [W * (0.06 + 0.88 * s), H * (0.48 + 0.1 * Math.sin(s * Math.PI * 2.2))];
      const [x0, y0] = ponto(varrer.k), [x1, y1] = ponto(k);
      limpar(x0, y0, x1, y1);
      varrer.k = k;
      if (t >= 1) varrer = null; else continuar = true;
    }
    if (voltarNevoa(agora)) continuar = true;
    compor();
    if (continuar) id = requestAnimationFrame(ciclo);
  }
  function arrancar() { if (!id && pronto) id = requestAnimationFrame(ciclo); }

  const ponto = (e) => { const q = tela.getBoundingClientRect(); return [(e.clientX - q.left) * dpr, (e.clientY - q.top) * dpr]; };
  let anterior = null;
  tela.addEventListener('pointerdown', (e) => { anterior = ponto(e); caixa.classList.add('tocado'); limpar(...anterior, ...anterior); arrancar(); });
  tela.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' && !anterior) return;   // no toque, só com o dedo pousado
    const p = ponto(e);
    if (anterior) { limpar(...anterior, ...p); caixa.classList.add('tocado'); arrancar(); }
    anterior = p;
  });
  const largar = (e) => { if (e.pointerType !== 'mouse') anterior = null; };
  tela.addEventListener('pointerup', largar);
  tela.addEventListener('pointercancel', () => { anterior = null; });
  tela.addEventListener('pointerleave', () => { anterior = null; });

  function iniciar() {
    if (pronto) return;
    pronto = true;
    medir();
    new ResizeObserver(() => { medir(); }).observe(caixa);
    // o puxador: uma passagem sozinha, meio segundo depois de se ver
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      setTimeout(() => { varrer = { t0: performance.now(), dur: 1500, k: 0 }; arrancar(); }, 500);
    }, { threshold: 0.5 });
    io.observe(caixa);
  }
  if (img.complete && img.naturalWidth) iniciar(); else img.addEventListener('load', iniciar, { once: true });
})();
