// Funções comuns do gerador: escapar, imagens responsivas, vídeo, marca, ícones, dados estruturados.

export const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// O contexto de uma construção. base: onde o site vive (/nevoa no GitHub Pages); raiz: onde vivem as páginas desta
// proposta (a base, ou /propostas/b…). As imagens, letras e scripts são sempre os da base (partilhados).
export function criarContexto({ base, raiz, url, manifesto, fotos, usados }) {
  const ctx = { base, raiz, url, manifesto, fotos, usados };
  ctx.href = (caminho = '/') => (raiz + caminho).replace(/\/{2,}/g, '/');
  ctx.asset = (caminho = '/') => (base + caminho).replace(/\/{2,}/g, '/');
  ctx.abs = (caminho = '/') => url.replace(/\/$/, '') + caminho;     // url já inclui a base; caminho sem a base
  ctx.absPagina = (caminho = '/') => ctx.abs(ctx.href(caminho).slice(base.length) || '/');
  return ctx;
}

// <picture> com AVIF e WebP nas larguras que existem, e um JPEG de recurso.
// sizes: o que a imagem ocupa no ecrã; prioridade: só na imagem principal do primeiro ecrã (LCP).
export function foto(ctx, nome, { sizes = '100vw', classe = '', prioridade = false, cedo = false, alt, foco, largura } = {}) {
  const m = ctx.manifesto.fotos[nome];
  const info = ctx.fotos[nome];
  if (!m || !info) throw new Error(`Fotografia desconhecida: ${nome}`);
  return imagem(ctx, `${nome}-${m.resumo}`, m, { sizes, classe, prioridade, cedo, alt: alt ?? info.alt, foco: foco ?? info.foco, largura });
}

function imagem(ctx, prefixo, m, { sizes = '100vw', classe = '', prioridade = false, cedo = false, alt = '', foco = 50, largura }) {
  const larguras = largura ? m.larguras.filter((w) => w <= largura) : m.larguras;
  const ws = larguras.length ? larguras : [m.larguras[0]];
  const fontes = m.formatos.map((fmt) => {
    const srcset = ws.map((w) => { const f = `${prefixo}-${w}.${fmt}`; ctx.usados.add(f); return `${ctx.asset('/assets/img/' + f)} ${w}w`; }).join(', ');
    return `<source type="image/${fmt}" srcset="${srcset}" sizes="${esc(sizes)}">`;
  }).join('');
  const jpg = `${prefixo}-${m.jpg}.jpg`;
  ctx.usados.add(jpg);
  const h = Math.round(m.h * m.jpg / m.w);
  const estilo = foco !== 50 ? ` style="object-position:50% ${foco}%"` : '';
  const carregar = prioridade ? 'fetchpriority="high" decoding="async"' : cedo ? 'decoding="async"' : 'loading="lazy" decoding="async"';
  return `<picture${classe ? ` class="${classe}"` : ''}>${fontes}<img src="${ctx.asset('/assets/img/' + jpg)}" width="${m.jpg}" height="${h}" alt="${esc(alt)}" ${carregar}${estilo}></picture>`;
}

// O URL de uma variante de fotografia (para o preload da imagem principal).
export function urlVariante(ctx, nome, w, fmt = 'avif') {
  const m = ctx.manifesto.fotos[nome];
  const larg = m.larguras.includes(w) ? w : m.larguras[m.larguras.length - 1];
  const f = `${nome}-${m.resumo}-${larg}.${fmt}`;
  ctx.usados.add(f);
  return ctx.asset('/assets/img/' + f);
}
export function srcsetFoto(ctx, nome, fmt = 'avif') {
  const m = ctx.manifesto.fotos[nome];
  return m.larguras.map((w) => { const f = `${nome}-${m.resumo}-${w}.${fmt}`; ctx.usados.add(f); return `${ctx.asset('/assets/img/' + f)} ${w}w`; }).join(', ');
}
export function partilhaMarca(ctx) {
  const f = ctx.manifesto.marca.partilha;
  ctx.usados.add(f);
  return ctx.abs('/assets/img/' + f);
}

// A imagem de espera de um vídeo (WebP a 540 px): é o `poster` do próprio <video>, para o LCP ser ela.
export function posterUrl(ctx, nome) {
  const m = ctx.manifesto.videos[nome];
  const larg = m.larguras.includes(540) ? 540 : m.larguras[m.larguras.length - 1];
  const fmt = m.formatos.includes('webp') ? 'webp' : m.formatos[0];
  const f = `video-${nome}-${m.resumo}-${larg}.${fmt}`;
  ctx.usados.add(f);
  return ctx.asset('/assets/img/' + f);
}

// Vídeo sem som, em ciclo, que só toca quando se vê (o site.js liga-o depois do load), com botão de pausa (WCAG 2.2.2).
export function video(ctx, nome, { classe = '', rotulo = 'Vídeo', foco } = {}) {
  const m = ctx.manifesto.videos[nome];
  if (!m) throw new Error(`Vídeo desconhecido: ${nome}`);
  const mp4 = `${nome}-${m.mp4}.mp4`;
  ctx.usados.add('video:' + nome + '.mp4>' + mp4);
  return `<div class="video ${classe}" data-video>
  <video muted playsinline loop preload="none" poster="${posterUrl(ctx, nome)}" data-src="${ctx.asset('/assets/video/' + mp4)}" aria-label="${esc(rotulo)}" width="576" height="720"${foco !== undefined ? ` style="object-position:50% ${foco}%"` : ''}></video>
  <button class="video__botao" type="button" aria-pressed="false" data-video-botao>
    <svg class="i-pausa" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h3v14H8zM13 5h3v14h-3z"/></svg>
    <svg class="i-tocar" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>
    <span class="sr" data-video-rotulo>Pausar o vídeo</span>
  </button>
</div>`;
}

// Uma peça do logótipo (o desenho deles, recortado do preto) como <img> com srcset 1×/2×/3×.
export function marca(ctx, chave, altura, { classe = '', alt = '' } = {}) {
  const m = ctx.manifesto.marca[chave];
  if (!m) throw new Error(`Peça da marca desconhecida: ${chave}`);
  const alturas = m.alturas;
  const escolha = (x) => alturas.find((a) => a >= altura * x) ?? alturas[alturas.length - 1];
  const um = escolha(1), dois = escolha(2), tres = escolha(3);
  const f = (a, fmt) => { const n = `${chave}-${m.resumo}-${a}.${fmt}`; ctx.usados.add(n); return ctx.asset('/assets/img/' + n); };
  const w = Math.round(m.w * altura / m.h);
  return `<picture${classe ? ` class="${classe}"` : ''}><source type="image/webp" srcset="${f(um, 'webp')} 1x, ${f(dois, 'webp')} 2x, ${f(tres, 'webp')} 3x"><img src="${f(dois, 'png')}" width="${w}" height="${altura}" alt="${esc(alt)}" decoding="async"></picture>`;
}

export const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

// Ligação do WhatsApp com a mensagem já escrita (só se houver número).
export const whatsappHref = (numero, texto = '') => numero
  ? `https://wa.me/${numero}${texto ? '?text=' + encodeURIComponent(texto) : ''}`
  : '';

// Ícones de traço (24×24, traço 1,5), no desenho dos ícones dourados das publicações da NEVOA.
const T = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
export const icone = {
  seta: T('<path d="M5 12h13M13 6l6 6-6 6"/>'),
  setaCima: T('<path d="M7 17 17 7M9 7h8v8"/>'),
  anterior: T('<path d="M15 5l-7 7 7 7"/>'),
  seguinte: T('<path d="M9 5l7 7-7 7"/>'),
  menu: T('<path d="M4 9h16M4 15h16"/>'),
  fechar: T('<path d="M6 6l12 12M18 6 6 18"/>'),
  check: T('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  telefone: T('<path d="M6.6 3.5h2.6l1.4 4-1.9 1.3a12 12 0 0 0 6.5 6.5l1.3-1.9 4 1.4v2.6A2 2 0 0 1 18.4 20 15.4 15.4 0 0 1 4 5.6a2 2 0 0 1 2.6-2.1Z"/>'),
  email: T('<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="m4.5 7 7.5 6 7.5-6"/>'),
  instagram: T('<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".6" fill="currentColor"/>'),
  local: T('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>'),
  relogio: T('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  orcamento: T('<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20Z"/><path d="M14 3.5V8h4M9.5 12h5M9.5 15.5h5"/>'),
  estrela: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.5c.6 5 3.6 8 8.5 8.6-4.9.6-7.9 3.6-8.5 8.6-.6-5-3.6-8-8.5-8.6 4.9-.6 7.9-3.6 8.5-8.6Z"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5 5.1-1.3A9.9 9.9 0 1 0 12.04 2Zm0 18.1c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3a8.2 8.2 0 1 1 7 3.8Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.7 2.6 4.1 3.6 1.5.7 2.1.7 2.9.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>',
  // espaços
  casa: T('<path d="M3.5 11.5 12 4.5l8.5 7"/><path d="M6 9.8v10.7h12V9.8"/><path d="M10 20.5v-5.5h4v5.5"/>'),
  escritorio: T('<rect x="5.5" y="3.5" width="13" height="17" rx="1.5"/><path d="M9 7.5h1.5M13.5 7.5H15M9 11h1.5M13.5 11H15M9 14.5h1.5M13.5 14.5H15M10.5 20.5v-2.5h3v2.5"/>'),
  fabrica: T('<path d="M3.5 20.5h17M4.5 20.5v-9l5 3v-3l5 3V5h4v15.5"/><path d="M7.5 17.5h1.5M11.5 17.5H13"/>'),
  predio: T('<path d="M3.5 20.5h17M5.5 20.5V6.5l7-3v17M12.5 9.5l6 2v9"/><path d="M8 9h1.5M8 12.5h1.5M8 16h1.5M15 14.5h1M15 17.5h1"/>'),
  chave: T('<circle cx="8" cy="15.5" r="4"/><path d="m10.9 12.6 8.6-8.6M16.5 7l2.3 2.3M14.4 9.1l1.6 1.6"/>'),
  loja: T('<path d="M4 9.5 5.5 4.5h13L20 9.5"/><path d="M4 9.5c0 1.4 1.2 2.5 2.7 2.5s2.6-1.1 2.6-2.5c0 1.4 1.2 2.5 2.7 2.5s2.7-1.1 2.7-2.5c0 1.4 1.1 2.5 2.6 2.5S20 10.9 20 9.5"/><path d="M5.5 12v8.5h13V12M10 20.5v-4.5h4v4.5"/>'),
  cruz: T('<path d="M9.5 4.5h5v5h5v5h-5v5h-5v-5h-5v-5h5z"/>'),
  haltere: T('<path d="M3.5 9.5v5M6.5 7v10M17.5 7v10M20.5 9.5v5M6.5 12h11"/>'),
  taca: T('<path d="M8 3.5h8l-.8 5.6a3.2 3.2 0 0 1-6.4 0Z"/><path d="M12 12.5v6M8.5 20.5h7M8.4 7h7.2"/>'),
  capacete: T('<path d="M4.5 16a7.5 7.5 0 0 1 15 0"/><path d="M2.5 16h19v3h-19z"/><path d="M10 9V6.5h4V9"/>'),
  // porquê
  frasco: T('<path d="M8.5 10.5h6l1 2.5v7.5h-8V13Z"/><path d="M10 10.5V7h3.5v3.5M13.5 7h3.5l1.5-2M9.5 5h4.5"/>'),
  pessoas: T('<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0"/><circle cx="16.5" cy="9.5" r="2.4"/><path d="M15.4 14.4a4.5 4.5 0 0 1 5.1 4.6"/>'),
  plano: T('<rect x="4.5" y="5.5" width="15" height="15" rx="2.5"/><path d="M4.5 10h15M8.5 3.5v4M15.5 3.5v4M8 14h3M8 17h6"/>'),
  lupa: T('<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/><path d="m8 10.6 1.9 1.9 3.3-3.3"/>'),
  escudo: T('<path d="M12 3.5 19 6v5.5c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6Z"/><path d="m9 12 2.2 2.2L15.5 10"/>'),
  // lavandaria
  camisa: T('<path d="M9 3.5 4 6l1.5 4 2-1v11.5h9V9l2 1L20 6l-5-2.5c-.5 1.4-1.6 2.2-3 2.2s-2.5-.8-3-2.2Z"/>'),
  cama: T('<path d="M3.5 18.5v-10M3.5 15h17v3.5M20.5 15v-2.5a2 2 0 0 0-2-2h-8V15"/><circle cx="7" cy="12.4" r="1.7"/>'),
  edredao: T('<rect x="4" y="5.5" width="16" height="13" rx="2.5"/><path d="M4 10.5h16M8.5 14.5h7"/>'),
  farda: T('<path d="M9 3.5 5 6v14.5h14V6l-4-2.5L12 7.5z"/><path d="M12 7.5v13M8 14h1.5M14.5 14H16"/>'),
  ferro: T('<path d="M3.5 17.5h17c0-4.1-3.2-7-7.2-7H8.2c-2.4 0-4.2 3-4.7 7Z"/><path d="M9.5 10.5l1-4h6.5"/>'),
  cortina: T('<path d="M3.5 4.5h17M6 4.5v16M18 4.5v16M6 4.5c0 6 2.8 10 5 16M18 4.5c0 6-2.8 10-5 16"/>'),
  sapato: T('<path d="M3.5 17V9.5l4 1.5 2-2.5 3 3.5 6 2.3a2.2 2.2 0 0 1 2 2.2v1Z"/><path d="M3.5 20h17"/>'),
  hotel: T('<path d="M5 17.5a7 7 0 0 1 14 0M3.5 17.5h17M12 8V10.5M10.5 8h3M3.5 20.5h17"/>'),
  carrinha: T('<path d="M2.5 16.5v-9h11v9M13.5 10h4l3 3.5v3h-1.7"/><circle cx="7" cy="17" r="1.8"/><circle cx="16.8" cy="17" r="1.8"/><path d="M9 17h5.9"/>'),
  maquina: T('<rect x="4.5" y="3.5" width="15" height="17" rx="2.5"/><circle cx="12" cy="13" r="4.2"/><path d="M7.5 6.5H9M11 6.5h1"/>'),
};
