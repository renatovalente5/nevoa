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

// A mesma peça como fontes por largura (para um tamanho que muda com o ecrã, como o logótipo da intro): o srcset em
// WebP com «w», a PNG do meio para quem não lê WebP, e a largura/altura do desenho.
export function marcaFontes(ctx, chave, alturas) {
  const m = ctx.manifesto.marca[chave];
  if (!m) throw new Error(`Peça da marca desconhecida: ${chave}`);
  const ha = alturas.filter((a) => m.alturas.includes(a));
  if (ha.length !== alturas.length) throw new Error(`${chave}: faltam alturas no manifesto (corre scripts/imagens.py)`);
  const f = (a, fmt) => { const n = `${chave}-${m.resumo}-${a}.${fmt}`; ctx.usados.add(n); return ctx.asset('/assets/img/' + n); };
  const meio = ha[Math.floor(ha.length / 2)];
  return { srcset: ha.map((a) => `${f(a, 'webp')} ${Math.round(m.w * a / m.h)}w`).join(', '), src: f(meio, 'png'), w: m.w, h: m.h };
}

export const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

// Ligação do WhatsApp com a mensagem já escrita (só se houver número).
export const whatsappHref = (numero, texto = '') => numero
  ? `https://wa.me/${numero}${texto ? '?text=' + encodeURIComponent(texto) : ''}`
  : '';

// Os ícones (src/lib/icones.mjs, partilhado byte a byte com o painel, que os mostra para escolher o desenho dos cartões).
export { ICONES as icone } from '../lib/icones.mjs';
