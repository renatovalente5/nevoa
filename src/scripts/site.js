// NEVOA — o comportamento das páginas: cabeçalho, menu, vídeos, antes e depois, pedido de orçamento e entradas.
(() => {
  const html = document.documentElement;
  const reduzir = matchMedia('(prefers-reduced-motion: reduce)');

  // ---------- cabeçalho: linha por baixo (e fundo, por cima da capa) quando se desce ----------
  const topo = document.querySelector('[data-topo]');
  if (topo) {
    const ver = () => topo.classList.toggle('e-descida', scrollY > 8);
    ver();
    addEventListener('scroll', ver, { passive: true });
  }

  // ---------- menu de ecrã inteiro (telemóvel) ----------
  const botao = document.querySelector('[data-menu-botao]');
  const menu = document.querySelector('[data-menu]');
  if (botao && menu) {
    const rotulo = botao.querySelector('[data-menu-rotulo]');
    const fora = [document.querySelector('main'), document.querySelector('.rodape'), document.querySelector('.propostas')].filter(Boolean);
    const abrir = () => {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('abrir'));
      botao.setAttribute('aria-expanded', 'true');
      rotulo.textContent = 'Fechar o menu';
      html.classList.add('menu-aberto');
      topo && topo.classList.add('com-menu');
      fora.forEach((el) => { el.inert = true; });
      const primeiro = menu.querySelector('a');
      primeiro && primeiro.focus({ preventScroll: true });
    };
    const fechar = (devolver = true) => {
      if (menu.hidden) return;
      menu.hidden = true;
      menu.classList.remove('abrir');
      botao.setAttribute('aria-expanded', 'false');
      rotulo.textContent = 'Abrir o menu';
      html.classList.remove('menu-aberto');
      topo && topo.classList.remove('com-menu');
      fora.forEach((el) => { el.inert = false; });
      devolver && botao.focus({ preventScroll: true });
    };
    botao.addEventListener('click', () => (menu.hidden ? abrir() : fechar()));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) fechar(false); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) fechar(); });
    matchMedia('(min-width: 960px)').addEventListener('change', (e) => { if (e.matches) fechar(false); });
    addEventListener('pageshow', (e) => { if (e.persisted) fechar(false); });
  }

  // ---------- vídeos: só depois do load, só quando se vêem; botão de pausa ----------
  const videos = [...document.querySelectorAll('[data-video]')];
  const ligarVideos = () => {
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        const v = e.target.querySelector('video');
        if (e.isIntersecting && !v.dataset.parado) {
          if (!v.src) { v.src = v.dataset.src; v.load(); }
          v.play().catch(() => {});
        } else if (!e.isIntersecting && !v.paused) v.pause();
      }
    }, { threshold: 0.15 }) : null;
    for (const caixa of videos) {
      const v = caixa.querySelector('video');
      const b = caixa.querySelector('[data-video-botao]');
      const r = caixa.querySelector('[data-video-rotulo]');
      const marcar = (parado) => { b.setAttribute('aria-pressed', String(parado)); r.textContent = parado ? 'Reproduzir o vídeo' : 'Pausar o vídeo'; };
      if (reduzir.matches) { v.dataset.parado = '1'; marcar(true); }
      b.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (v.dataset.parado) {
          delete v.dataset.parado; marcar(false);
          if (!v.src) { v.src = v.dataset.src; v.load(); }
          v.play().catch(() => {});
        } else { v.dataset.parado = '1'; v.pause(); marcar(true); }
      });
      io ? io.observe(caixa) : (!v.dataset.parado && (v.src = v.dataset.src, v.play().catch(() => {})));
    }
  };
  if (videos.length) {
    if (document.readyState === 'complete') setTimeout(ligarVideos, 150);
    else addEventListener('load', () => setTimeout(ligarVideos, 150), { once: true });
  }

  // ---------- antes e depois: abas (setas do teclado, como manda o padrão ARIA) ----------
  for (const grupo of document.querySelectorAll('[data-abas]')) {
    const abas = [...grupo.querySelectorAll('[role="tab"]')];
    const escolher = (aba, focar) => {
      for (const a of abas) {
        const sel = a === aba;
        a.setAttribute('aria-selected', String(sel));
        a.tabIndex = sel ? 0 : -1;
        document.getElementById(a.getAttribute('aria-controls')).hidden = !sel;
      }
      focar && aba.focus();
      aba.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduzir.matches ? 'auto' : 'smooth' });
    };
    abas.forEach((a, i) => {
      a.addEventListener('click', () => escolher(a, false));
      a.addEventListener('keydown', (e) => {
        const k = { ArrowRight: 1, ArrowLeft: -1, Home: -i, End: abas.length - 1 - i }[e.key];
        if (k === undefined) return;
        e.preventDefault();
        escolher(abas[(i + k + abas.length) % abas.length], true);
      });
    });
  }

  // ---------- pedido de orçamento: a mensagem já escrita, pelo WhatsApp ou por email ----------
  const form = document.querySelector('[data-pedido]');
  if (form) {
    const erro = form.querySelector('[data-pedido-erro]');
    const escolherPeloEndereco = () => {
      const m = location.hash.match(/^#pedido-([a-z]+)$/);
      if (!m) return;
      const r = form.querySelector(`input[data-tipo="${m[1]}"]`);
      if (r) r.checked = true;
      form.scrollIntoView({ block: 'start' });
    };
    escolherPeloEndereco();
    addEventListener('hashchange', escolherPeloEndereco);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const dados = new FormData(form);
      const nome = String(dados.get('nome') || '').trim();
      if (!nome) {
        erro.hidden = false;
        form.querySelector('[name="nome"]').focus();
        return;
      }
      erro.hidden = true;
      const servico = String(dados.get('servico') || '');
      const local = String(dados.get('localidade') || '').trim();
      const msg = String(dados.get('mensagem') || '').trim();
      const linhas = [`Olá! Sou ${nome} e gostava de pedir um orçamento à NEVOA.`, '', `Serviço: ${servico}`];
      if (local) linhas.push(`Localidade: ${local}`);
      if (msg) linhas.push('', msg);
      const texto = linhas.join('\n');
      const canal = e.submitter && e.submitter.value;
      if (canal === 'whatsapp' && form.dataset.whatsapp) {
        location.href = `https://wa.me/${form.dataset.whatsapp}?text=${encodeURIComponent(texto)}`;
      } else {
        location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent('Pedido de orçamento — ' + servico)}&body=${encodeURIComponent(texto)}`;
      }
    });
  }

  // ---------- entradas ao descer (só abaixo do primeiro ecrã; filas que deslizam entram inteiras) ----------
  if (!reduzir.matches && 'IntersectionObserver' in window) {
    const ALVOS = '.seccao__cab, .servico-cartao, .espacos, .tabela-divisoes, .ad-bloco__texto, .ad, .casa__foto, .casa__texto, .cartao, .lista-check li, .passo, .dividido__media, .faixa, .contacto, .pedido, .peca, .rodape__grelha > *';
    const io = new IntersectionObserver((entradas) => {
      let n = 0;
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        const el = e.target;
        el.style.setProperty('--d', `${Math.min(n++, 6) * 0.08}s`);
        el.classList.add('visivel');
        io.unobserve(el);
        const fim = (ev) => {
          if (ev.target !== el || ev.propertyName !== 'opacity') return;
          el.classList.remove('revelar', 'visivel'); el.style.removeProperty('--d');
          el.removeEventListener('transitionend', fim);
        };
        el.addEventListener('transitionend', fim);
      }
    }, { rootMargin: '0px 0px -8% 0px' });
    for (const el of document.querySelectorAll(ALVOS)) {
      if (el.parentElement.closest(ALVOS)) continue;
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight || r.width === 0) continue;
      el.classList.add('revelar');
      io.observe(el);
    }
  }
})();
