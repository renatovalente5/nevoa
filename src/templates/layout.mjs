// A moldura de todas as páginas: <head>, cabeçalho, menu, rodapé e (na pré-visualização) a barra das propostas.
import { esc, marca, icone, jsonLd, whatsappHref } from './util.mjs';
import { livroReclamacoes, telefoneHtml } from '../../legal-comum/index.mjs';

export const VARIANTES = {
  a: { nome: 'Névoa', tema: 'escuro', resumo: 'preto e dourado, com a névoa dourada a mexer na capa' },
  b: { nome: 'Seda', tema: 'claro', resumo: 'marfim e dourado, calmo, com o vídeo dos vidros na capa' },
  c: { nome: 'Vidro', tema: 'claro', resumo: 'marfim, em mosaico, com o vidro embaciado que se limpa com o dedo' },
};

export const NAV = [
  ['limpeza', '/limpeza/', 'Limpeza'],
  ['empresas', '/empresas/', 'Empresas'],
  ['lavandaria', '/lavandaria/', 'Lavandaria'],
  ['contactos', '/contactos/', 'Contactos'],
];

export function pagina(ctx, p) {
  const { site, assets, opcoes, variante } = ctx;
  const v = VARIANTES[variante];
  const escuro = v.tema === 'escuro';
  const titulo = p.titulo === site.marca ? site.titulo : `${p.titulo} | ${site.marcaCurta}`;
  const canonical = ctx.absPagina(p.caminho);
  const indexar = !opcoes.preview && p.indexar !== false && !p.legal;
  const og = p.ogImagem || ctx.partilhaMarca;
  const atual = (c) => p.seccao === c ? ' aria-current="page"' : '';
  const temaCor = escuro ? '#0B0A08' : '#F6F1E9';
  const precarregar = (p.precarregar || []).map((pr) => pr.href
    ? `<link rel="preload" as="image" type="image/${pr.fmt}" href="${pr.href}" fetchpriority="high">`
    : `<link rel="preload" as="image" type="image/${pr.fmt}" imagesrcset="${pr.srcset}" imagesizes="${esc(pr.sizes)}" fetchpriority="high">`).join('\n');
  const wa = whatsappHref(site.whatsapp, 'Olá! Gostava de pedir um orçamento à NEVOA.');
  const logo = escuro ? 'palavra' : 'palavra-escuro';
  const scripts = [assets.js, ...(p.scripts || []).map((s) => assets[s])];

  return `<!doctype html>
<html lang="pt-PT" data-tema="${v.tema}" data-variante="${variante}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>@media (prefers-reduced-motion: no-preference){@view-transition{navigation:auto}}</style>
<script>document.documentElement.classList.add('js')</script>
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(p.descricao || site.descricao)}">
${indexar ? '' : '<meta name="robots" content="noindex">\n'}<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_PT">
<meta property="og:site_name" content="${esc(site.marca)}">
<meta property="og:title" content="${esc(p.ogTitulo || (p.titulo === site.marca ? site.titulo : p.titulo))}">
<meta property="og:description" content="${esc(p.descricao || site.descricao)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="${temaCor}">
<link rel="icon" href="${ctx.asset('/favicon.png')}" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="${ctx.asset('/apple-touch-icon.png')}">
<link rel="manifest" href="${ctx.asset('/site.webmanifest')}">
<link rel="preload" href="${ctx.asset('/assets/fontes/' + assets.fonte)}" as="font" type="font/woff2" crossorigin>
${precarregar}
<link rel="stylesheet" href="${ctx.asset('/assets/' + assets.css)}">
${scripts.map((s) => `<script src="${ctx.asset('/assets/' + s)}" defer></script>`).join('\n')}
${(p.jsonLd || []).map(jsonLd).join('\n')}
</head>
<body class="pagina-${p.seccao || 'outra'} v-${variante}${p.classe ? ' ' + p.classe : ''}">
<a class="saltar" href="#conteudo">Saltar para o conteúdo</a>
<header class="topo${p.topoSobreCapa ? ' topo--sobre-capa' : ''}" data-topo>
  <div class="topo__barra contentor">
    <a class="topo__marca" href="${ctx.href('/')}" aria-label="${esc(site.marca)}, página inicial">${marca(ctx, logo, 24, { classe: 'topo__logo' })}</a>
    <nav class="topo__nav" aria-label="Principal">
      <ul>${NAV.map(([c, h, t]) => `<li><a href="${ctx.href(h)}"${atual(c)}>${t}</a></li>`).join('')}</ul>
    </nav>
    <a class="botao botao--ouro botao--pequeno topo__pedido" href="${ctx.href('/contactos/')}#pedido">Pedir orçamento</a>
    <button class="topo__menu" type="button" aria-expanded="false" aria-controls="menu" data-menu-botao>
      <span class="topo__menu-abrir">${icone.menu}</span><span class="topo__menu-fechar">${icone.fechar}</span><span class="sr" data-menu-rotulo>Abrir o menu</span>
    </button>
  </div>
</header>
<div class="menu" id="menu" hidden data-menu>
  <nav class="menu__nav contentor" aria-label="Menu">
    <ul class="menu__lista">
      <li><a href="${ctx.href('/')}"${p.seccao === 'inicio' ? ' aria-current="page"' : ''}>Início</a></li>
      <li><a href="${ctx.href('/limpeza/')}"${atual('limpeza')}>Limpeza profissional</a></li>
      <li><a href="${ctx.href('/empresas/')}"${atual('empresas')}>Limpeza para empresas</a></li>
      <li><a href="${ctx.href('/lavandaria/')}"${atual('lavandaria')}>Lavandaria &amp; Engomadoria</a></li>
      <li><a href="${ctx.href('/a-nevoa/')}"${atual('sobre')}>A NEVOA</a></li>
      <li><a href="${ctx.href('/contactos/')}"${atual('contactos')}>Contactos</a></li>
    </ul>
    <div class="menu__pe">
      <a class="botao botao--ouro" href="${ctx.href('/contactos/')}#pedido">Pedir orçamento</a>
      ${wa ? `<a class="botao botao--linha" href="${wa}" target="_blank" rel="noopener">${icone.whatsapp}WhatsApp</a>` : ''}
      <p class="menu__telefone">${telefoneHtml(site.telefone, { frase: 'com-a' })}</p>
    </div>
  </nav>
</div>
<main id="conteudo" tabindex="-1">
${p.corpo}
</main>
${rodape(ctx)}
${opcoes.propostas ? barraPropostas(ctx, p) : ''}
</body>
</html>
`;
}

function rodape(ctx) {
  const { site, variante } = ctx;
  const escuro = VARIANTES[variante].tema === 'escuro';
  const ano = new Date().getFullYear();
  const wa = whatsappHref(site.whatsapp, 'Olá! Gostava de pedir um orçamento à NEVOA.');
  return `<footer class="rodape">
  <div class="contentor rodape__grelha">
    <div class="rodape__marca">
      <a href="${ctx.href('/')}" class="rodape__logo" aria-label="${esc(site.marca)}, página inicial">${marca(ctx, escuro ? 'completo' : 'completo-escuro', 96)}</a>
      <p class="rodape__frase">${esc(site.frase)}</p>
      <p class="rodape__redes">
        <a href="https://www.instagram.com/${site.instagram}/" target="_blank" rel="noopener" class="redonda">${icone.instagram}<span class="sr">Instagram</span></a>
        ${wa ? `<a href="${wa}" target="_blank" rel="noopener" class="redonda">${icone.whatsapp}<span class="sr">WhatsApp</span></a>` : ''}
        <a href="mailto:${site.email}" class="redonda">${icone.email}<span class="sr">Email</span></a>
      </p>
    </div>
    <nav class="rodape__coluna" aria-label="Serviços">
      <h2 class="rodape__titulo">Serviços</h2>
      <ul>
        <li><a href="${ctx.href('/limpeza/')}">Limpeza profissional</a></li>
        <li><a href="${ctx.href('/empresas/')}">Limpeza para empresas</a></li>
        <li><a href="${ctx.href('/limpeza/')}#pos-obra">Limpeza pós-obra</a></li>
        <li><a href="${ctx.href('/lavandaria/')}">Lavandaria &amp; Engomadoria</a></li>
        <li><a href="${ctx.href('/lavandaria/')}#recolha">Recolha e entrega</a></li>
      </ul>
    </nav>
    <nav class="rodape__coluna" aria-label="A NEVOA">
      <h2 class="rodape__titulo">A NEVOA</h2>
      <ul>
        <li><a href="${ctx.href('/a-nevoa/')}">Quem somos</a></li>
        <li><a href="${ctx.href('/limpeza/')}#antes-e-depois">Antes e depois</a></li>
        <li><a href="${ctx.href('/contactos/')}#zona">Onde trabalhamos</a></li>
        <li><a href="${ctx.href('/contactos/')}#pedido">Pedir orçamento</a></li>
      </ul>
    </nav>
    <div class="rodape__coluna">
      <h2 class="rodape__titulo">Fale connosco</h2>
      <ul class="rodape__contactos">
        ${wa ? `<li><a href="${wa}" target="_blank" rel="noopener"><span class="rodape__icone">${icone.whatsapp}</span>WhatsApp</a></li>` : ''}
        <li><span class="rodape__icone">${icone.telefone}</span><span>${telefoneHtml(site.telefone, { frase: 'com-a', comIndicativo: false })}</span></li>
        <li><a href="mailto:${site.email}"><span class="rodape__icone">${icone.email}</span>${esc(site.email)}</a></li>
        <li><span class="rodape__icone">${icone.local}</span><span>${esc(site.zona.resumo)}</span></li>
      </ul>
    </div>
  </div>
  <div class="contentor rodape__legal">
    <p>© ${ano} ${esc(site.marca)}</p>
    <ul>
      <li><a href="${ctx.href('/privacidade/')}">Privacidade</a></li>
      <li><a href="${ctx.href('/litigios/')}">Resolução de litígios</a></li>
      <li>${livroReclamacoes()}</li>
    </ul>
  </div>
</footer>`;
}

// Na pré-visualização: uma pílula ao fundo para trocar de proposta (só a página inicial muda de desenho).
function barraPropostas(ctx, p) {
  const raizDe = (k) => ctx.asset(k === ctx.opcoes.padrao ? '/' : `/propostas/${k}/`);
  return `<nav class="propostas" aria-label="Propostas de desenho">
  <span class="propostas__titulo">Propostas</span>
  ${Object.entries(VARIANTES).map(([k, v]) => `<a href="${raizDe(k)}"${k === ctx.variante ? ' aria-current="page"' : ''}><b>${k.toUpperCase()}</b> ${esc(v.nome)}</a>`).join('')}
</nav>`;
}
