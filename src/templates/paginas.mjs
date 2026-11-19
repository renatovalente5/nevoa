// As páginas do site. Cada função devolve { caminho, titulo, descricao, seccao, corpo, … } para o layout.
import { esc, foto, video, marca, icone, whatsappHref, urlVariante, srcsetFoto, posterUrl } from './util.mjs';
import { telefoneHtml, ralHtml, destinatariosHtml, direitosHtml, frasesPrivacidade, prazos } from '../../legal-comum/index.mjs';

const PEDIDOS = {
  casa: 'Limpeza de casa',
  empresa: 'Limpeza para empresa',
  posobra: 'Limpeza pós-obra',
  al: 'Alojamento local',
  condominio: 'Condomínio',
  lavandaria: 'Lavandaria e engomadoria',
  outro: 'Outro',
};

const migalhas = (ctx, itens) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [['Início', '/'], ...itens].map(([nome, caminho], i) => ({ '@type': 'ListItem', position: i + 1, name: nome, item: ctx.absPagina(caminho) })),
});

const negocio = (ctx) => {
  const { site } = ctx;
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': ctx.absPagina('/') + '#negocio',
    name: site.marca,
    alternateName: ['NEVOA', 'Névoa Premium Services', 'NEVOA Premium Services', 'Nevoa Services'],
    slogan: site.lema,
    description: site.descricao,
    url: ctx.absPagina('/'),
    logo: ctx.partilhaMarca,
    image: ctx.partilhaMarca,
    telephone: '+351' + site.telefone.replace(/\s/g, ''),
    email: site.email,
    address: { '@type': 'PostalAddress', streetAddress: site.morada.rua, postalCode: site.morada.codigoPostal, addressLocality: site.morada.localidade, addressRegion: site.morada.distrito, addressCountry: 'PT' },
    areaServed: site.zona.concelhos.map((c) => ({ '@type': 'City', name: c })),
    openingHours: site.horario.schema,
    sameAs: [`https://www.instagram.com/${site.instagram}/`],
    knowsAbout: ['Limpeza profissional', 'Limpeza de casas', 'Limpeza de escritórios', 'Limpeza pós-obra', 'Limpeza de condomínios', 'Limpeza de alojamento local', 'Lavandaria', 'Engomadoria', 'Recolha e entrega de roupa'],
  };
};

// ---------- peças comuns ----------

const rotulo = (t) => `<p class="rotulo">${t}</p>`;

function cabecalho({ rotuloTexto, titulo, frase, acoes = '', estado = '' }) {
  return `<header class="cab contentor">
  ${rotuloTexto ? rotulo(rotuloTexto) : ''}
  <h1 class="cab__titulo">${titulo}</h1>
  ${estado}
  ${frase ? `<p class="cab__frase">${frase}</p>` : ''}
  ${acoes ? `<div class="cab__acoes">${acoes}</div>` : ''}
</header>`;
}

const seccao = ({ id = '', classe = '', rot = '', titulo, sub = '', corpo }) => `<section class="seccao ${classe}"${id ? ` id="${id}"` : ''}${titulo ? ` aria-labelledby="t-${id || classe}"` : ''}>
  <div class="contentor">
    ${titulo ? `<div class="seccao__cab">${rot ? rotulo(rot) : ''}<h2 class="titulo-seccao" id="t-${id || classe}">${titulo}</h2>${sub ? `<p class="seccao__sub">${sub}</p>` : ''}</div>` : ''}
    ${corpo}
  </div>
</section>`;

const botaoPedido = (ctx, tipo = '', texto = 'Pedir orçamento', classe = 'botao botao--ouro') =>
  `<a class="${classe}" href="${ctx.href('/contactos/')}#pedido${tipo ? '-' + tipo : ''}">${texto}</a>`;

const botaoWhatsapp = (ctx, texto = 'WhatsApp', mensagem = 'Olá! Gostava de pedir um orçamento à NEVOA.') => {
  const wa = whatsappHref(ctx.site.whatsapp, mensagem);
  return wa ? `<a class="botao botao--linha" href="${wa}" target="_blank" rel="noopener">${icone.whatsapp}${texto}</a>` : '';
};

const estadoEtiqueta = (estado) => estado === 'em-breve'
  ? '<span class="etiqueta etiqueta--breve">Em breve</span>'
  : '<span class="etiqueta etiqueta--ativo"><i aria-hidden="true"></i>Já disponível</span>';

function confianca(ctx) {
  return `<ul class="confianca" aria-label="Porquê pedir à NEVOA">
    <li>${icone.orcamento}<span>Orçamento sem compromisso</span></li>
    <li>${icone.relogio}<span>${esc(ctx.site.horario.curto)}</span></li>
    <li>${icone.local}<span>${esc(ctx.site.zona.curto)}</span></li>
  </ul>`;
}

// Os dois serviços: a limpeza (vídeo real dos vidros) e a lavandaria (o letreiro da loja), cartões inteiros que levam à página.
function cartoesServicos(ctx, { sizes = '(min-width: 900px) 560px, 92vw' } = {}) {
  return `<div class="servicos-2">
  <article class="servico-cartao">
    <div class="servico-cartao__media">${video(ctx, 'vidros', { rotulo: 'A equipa da NEVOA a limpar uma janela ao pôr do sol', foco: 30 })}</div>
    <div class="servico-cartao__corpo">
      ${estadoEtiqueta('ativo')}
      <h3><a href="${ctx.href('/limpeza/')}" class="servico-cartao__ligacao">Limpeza profissional</a></h3>
      <p>Casas, empresas, condomínios, alojamento local e pós-obra, com produtos profissionais.</p>
      <span class="seta-circulo" aria-hidden="true">${icone.seta}</span>
    </div>
  </article>
  <article class="servico-cartao">
    <div class="servico-cartao__media">${foto(ctx, 'loja-letreiro', { sizes, classe: 'servico-cartao__foto' })}</div>
    <div class="servico-cartao__corpo">
      ${estadoEtiqueta('em-breve')}
      <h3><a href="${ctx.href('/lavandaria/')}" class="servico-cartao__ligacao">Lavandaria &amp; Engomadoria</a></h3>
      <p>Lavar, secar e engomar, com recolha e entrega ao domicílio. Abre em breve, em Felgueiras.</p>
      <span class="seta-circulo" aria-hidden="true">${icone.seta}</span>
    </div>
  </article>
</div>`;
}

function filaEspacos(ctx, { comLinha = false } = {}) {
  return `<ul class="espacos" role="list">
  ${ctx.conteudo.espacos.map((e) => `<li class="espaco"><a href="${ctx.href('/' + e.pagina + '/')}#${e.slug}">
    <span class="circulo-icone">${icone[e.icone]}</span><span class="espaco__nome">${esc(e.nome)}</span>${comLinha ? `<span class="espaco__linha">${esc(e.linha)}</span>` : ''}
  </a></li>`).join('\n  ')}
</ul>`;
}

// Antes e depois: as duas fotografias lado a lado (não são do mesmo ângulo, por isso nada de cortina), com abas.
function antesDepois(ctx, { pares = ctx.conteudo.antesDepois.slice(0, 4), sizes = '(min-width: 900px) 300px, 46vw', id = 'ad' } = {}) {
  const abas = pares.map((p, i) => `<button type="button" role="tab" id="${id}-aba-${p.slug}" aria-controls="${id}-${p.slug}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${esc(p.nome)}</button>`).join('');
  const paineis = pares.map((p, i) => `<div class="ad__par" role="tabpanel" id="${id}-${p.slug}" aria-labelledby="${id}-aba-${p.slug}"${i ? ' hidden' : ''}>
      <figure class="ad__foto">${foto(ctx, `posobra-${p.slug}-antes`, { sizes })}<figcaption class="ad__etiqueta">Antes</figcaption></figure>
      <figure class="ad__foto">${foto(ctx, `posobra-${p.slug}-depois`, { sizes })}<figcaption class="ad__etiqueta ad__etiqueta--depois">Depois</figcaption></figure>
    </div>`).join('\n    ');
  return `<div class="ad" data-abas>
    <div class="ad__abas" role="tablist" aria-label="Divisões">${abas}</div>
    ${paineis}
  </div>`;
}

function nossaCasa(ctx, { titulo = 'A nossa casa, em Felgueiras' } = {}) {
  const { site } = ctx;
  return `<div class="casa">
  <div class="casa__foto">${foto(ctx, 'loja-fachada', { sizes: '(min-width: 900px) 560px, 92vw' })}</div>
  <div class="casa__texto">
    ${rotulo('A nossa loja')}
    <h2 class="titulo-seccao" id="t-casa">${titulo}</h2>
    <p>Um espaço, dois serviços. A limpeza já está no terreno; a lavandaria e engomadoria abre aqui em breve.</p>
    <p class="casa__morada">${icone.local}<span>${esc(site.morada.rua)}<br>${esc(site.morada.codigoPostal)} ${esc(site.morada.localidade)}</span></p>
    <div class="casa__acoes">
      <a class="botao botao--linha" href="${site.mapa}" target="_blank" rel="noopener">Como chegar</a>
      <a class="ligacao-seta" href="${ctx.href('/a-nevoa/')}">Conhecer a NEVOA ${icone.seta}</a>
    </div>
  </div>
</div>`;
}

// ---------- página inicial: três propostas ----------

export function inicio(ctx) {
  const v = ctx.variante;
  const corpo = v === 'a' ? inicioA(ctx) : v === 'b' ? inicioB(ctx) : inicioC(ctx);
  const precarregar = v === 'b'
    ? [{ href: posterUrl(ctx, 'vidros'), fmt: 'webp' }]
    : v === 'c' ? [{ srcset: srcsetFoto(ctx, 'loja-letreiro'), sizes: '(min-width: 1100px) 1040px, 94vw', fmt: 'avif' }] : [];
  return {
    caminho: '/',
    titulo: ctx.site.marca,
    descricao: ctx.site.descricao,
    seccao: 'inicio',
    classe: 'inicio',
    topoSobreCapa: v === 'a',
    scripts: v === 'a' ? ['nevoa'] : v === 'c' ? ['vidro'] : [],
    precarregar,
    corpo,
    jsonLd: [
      { '@context': 'https://schema.org', '@type': 'WebSite', name: ctx.site.marca, alternateName: ['NEVOA', 'Névoa Premium Services'], url: ctx.absPagina('/') },
      negocio(ctx),
    ],
  };
}

// A «Névoa»: preto e dourado, a névoa dourada a mexer devagar atrás do título (WebGL, parada com movimento reduzido).
function inicioA(ctx) {
  return `<section class="capa capa--nevoa" aria-labelledby="t-capa">
  <canvas class="capa__nevoa" aria-hidden="true" data-nevoa></canvas>
  <div class="capa__emblema" aria-hidden="true">${marca(ctx, 'emblema', 240)}</div>
  <div class="capa__veu" aria-hidden="true"></div>
  <div class="contentor capa__texto">
    ${rotulo('Limpeza &amp; Lavandaria · Felgueiras')}
    <h1 class="capa__titulo" id="t-capa">Onde cada <span class="dourado">detalhe</span> conta.</h1>
    <p class="capa__frase">Limpeza profissional para casas e empresas. Lavandaria e engomadoria, com recolha e entrega ao domicílio.</p>
    <div class="capa__botoes">${botaoPedido(ctx)}<a class="botao botao--linha" href="#servicos">Ver os serviços</a></div>
    ${confianca(ctx)}
  </div>
</section>
${seccao({ id: 'servicos', rot: 'Dois serviços', titulo: 'Uma só NEVOA', corpo: cartoesServicos(ctx) + `<div class="servicos__espacos" id="espacos"><h3 class="servicos__espacos-titulo">Para cada espaço</h3>${filaEspacos(ctx)}</div>` })}
${seccao({ id: 'antes-e-depois', classe: 'seccao--ad', corpo: `<div class="ad-bloco">
  <div class="ad-bloco__texto">
    ${rotulo('Antes e depois')}
    <h2 class="titulo-seccao" id="t-antes-e-depois">Do pó da obra à perfeição</h2>
    <p>Uma moradia acabada de construir, entregue pronta a habitar: poeiras, resíduos, vidros e pavimentos, divisão a divisão.</p>
    <a class="ligacao-seta" href="${ctx.href('/limpeza/')}#antes-e-depois">Ver mais resultados ${icone.seta}</a>
  </div>
  ${antesDepois(ctx)}
</div>` })}
<section class="seccao seccao--casa" aria-labelledby="t-casa"><div class="contentor">${nossaCasa(ctx)}</div></section>`;
}

// B «Seda»: marfim e dourado, calmo; o vídeo real dos vidros numa moldura alta ao lado do título.
function inicioB(ctx) {
  return `<section class="capa capa--seda" aria-labelledby="t-capa">
  <div class="contentor capa__grelha">
    <div class="capa__texto">
      ${rotulo('Limpeza &amp; Lavandaria · Felgueiras')}
      <h1 class="capa__titulo" id="t-capa">Onde cada <span class="dourado">detalhe</span> conta.</h1>
      <p class="capa__frase">Limpeza profissional para casas e empresas. Lavandaria e engomadoria, com recolha e entrega ao domicílio.</p>
      <div class="capa__botoes">${botaoPedido(ctx)}${botaoWhatsapp(ctx)}</div>
      ${confianca(ctx)}
    </div>
    <div class="capa__media">
      ${video(ctx, 'vidros', { classe: 'video--capa', rotulo: 'A equipa da NEVOA a limpar uma janela ao pôr do sol', foco: 35 })}
      <p class="capa__legenda">${icone.estrela}<span>A nossa equipa, no terreno desde 1 de outubro</span></p>
    </div>
  </div>
</section>
${seccao({ id: 'servicos', rot: 'Dois serviços', titulo: 'Uma só NEVOA', corpo: cartoesServicos(ctx) + `<div class="servicos__espacos" id="espacos"><h3 class="servicos__espacos-titulo">Para cada espaço</h3>${filaEspacos(ctx)}</div>` })}
${seccao({ id: 'antes-e-depois', classe: 'seccao--ad', corpo: `<div class="ad-bloco">
  <div class="ad-bloco__texto">
    ${rotulo('Antes e depois')}
    <h2 class="titulo-seccao" id="t-antes-e-depois">Do pó da obra à perfeição</h2>
    <p>Uma moradia acabada de construir, entregue pronta a habitar: poeiras, resíduos, vidros e pavimentos, divisão a divisão.</p>
    <a class="ligacao-seta" href="${ctx.href('/limpeza/')}#antes-e-depois">Ver mais resultados ${icone.seta}</a>
  </div>
  ${antesDepois(ctx)}
</div>` })}
<section class="seccao seccao--casa" aria-labelledby="t-casa"><div class="contentor">${nossaCasa(ctx)}</div></section>`;
}

// C «Vidro»: o letreiro da loja atrás de um vidro embaciado, que se limpa com o dedo (canvas); o resto em mosaico.
function inicioC(ctx) {
  const { site } = ctx;
  return `<section class="capa capa--vidro" aria-labelledby="t-capa">
  <div class="contentor">
    <div class="capa__texto">
      ${rotulo('Limpeza &amp; Lavandaria · Felgueiras')}
      <h1 class="capa__titulo" id="t-capa">Onde cada <span class="dourado">detalhe</span> conta.</h1>
      <p class="capa__frase">Limpeza profissional para casas e empresas. Lavandaria e engomadoria, com recolha e entrega ao domicílio.</p>
      <div class="capa__botoes">${botaoPedido(ctx)}${botaoWhatsapp(ctx)}</div>
    </div>
    <div class="vidro" data-vidro>
      ${foto(ctx, 'loja-letreiro', { sizes: '(min-width: 1100px) 1040px, 94vw', prioridade: true, classe: 'vidro__foto', foco: 46 })}
      <canvas class="vidro__nevoa" aria-hidden="true"></canvas>
      <p class="vidro__dica" aria-hidden="true">${icone.estrela}<span>Passe o dedo pelo vidro</span></p>
    </div>
  </div>
</section>
<section class="seccao seccao--mosaico" aria-label="A NEVOA em resumo">
  <div class="contentor mosaico">
    <a class="peca peca--media peca--limpeza" href="${ctx.href('/limpeza/')}">
      ${video(ctx, 'vidros', { rotulo: 'A equipa da NEVOA a limpar uma janela ao pôr do sol', foco: 30 })}
      <span class="peca__corpo">${estadoEtiqueta('ativo')}<span class="peca__titulo">Limpeza profissional</span><span class="peca__linha">Casas, empresas, condomínios, alojamento local e pós-obra.</span></span>
    </a>
    <a class="peca peca--media peca--lavandaria" href="${ctx.href('/lavandaria/')}">
      ${foto(ctx, 'marca-lavandaria', { sizes: '(min-width: 900px) 380px, 92vw' })}
      <span class="peca__corpo">${estadoEtiqueta('em-breve')}<span class="peca__titulo">Lavandaria &amp; Engomadoria</span><span class="peca__linha">Lavar, secar e engomar, com recolha e entrega.</span></span>
    </a>
    <a class="peca peca--empresas" href="${ctx.href('/empresas/')}">
      <span class="circulo-icone">${icone.escritorio}</span>
      <span class="peca__titulo">Para empresas</span>
      <span class="peca__linha">Escritórios, indústria, comércio e condomínios, com um plano à medida.</span>
      <span class="seta-circulo" aria-hidden="true">${icone.seta}</span>
    </a>
    <div class="peca peca--ad">
      <div class="peca__cab">${rotulo('Antes e depois')}<h2 class="peca__titulo">Do pó da obra à perfeição</h2><p class="peca__linha">Uma moradia acabada de construir, entregue pronta a habitar.</p><a class="ligacao-seta" href="${ctx.href('/limpeza/')}#antes-e-depois">Ver mais resultados ${icone.seta}</a></div>
      ${antesDepois(ctx, { sizes: '(min-width: 900px) 260px, 44vw', id: 'adc' })}
    </div>
    <div class="peca peca--espacos">
      <h2 class="peca__titulo">Para cada espaço</h2>
      <ul class="fichas" role="list">${ctx.conteudo.espacos.map((e) => `<li><a href="${ctx.href('/' + e.pagina + '/')}#${e.slug}">${icone[e.icone]}${esc(e.nome)}</a></li>`).join('')}</ul>
    </div>
    <a class="peca peca--media peca--casa" href="${ctx.href('/a-nevoa/')}">
      ${foto(ctx, 'loja-fachada', { sizes: '(min-width: 900px) 760px, 92vw' })}
      <span class="peca__corpo"><span class="peca__titulo">A nossa casa, em Felgueiras</span><span class="peca__linha">${esc(site.morada.rua)}</span></span>
    </a>
    <div class="peca peca--pedido">
      <span class="circulo-icone">${icone.orcamento}</span>
      <h2 class="peca__titulo">Orçamento sem compromisso</h2>
      <p class="peca__linha">${esc(site.horario.texto)}.</p>
      ${botaoPedido(ctx)}
    </div>
  </div>
</section>`;
}

// ---------- serviços ----------

export function limpeza(ctx) {
  const c = ctx.conteudo;
  const corpo = `${cabecalho({
    rotuloTexto: 'Limpeza profissional',
    titulo: 'Espaços limpos. <span class="dourado">Vidas mais leves.</span>',
    estado: estadoEtiqueta('ativo'),
    frase: 'Para casas, empresas, condomínios, alojamento local e obras acabadas. Limpeza regular ou a fundo, com produtos profissionais e atenção a cada pormenor.',
    acoes: `${botaoPedido(ctx, 'casa')}${botaoWhatsapp(ctx)}`,
  })}
${seccao({ id: 'espacos', rot: 'Para cada espaço', titulo: 'Uma solução para cada espaço', corpo: `<ul class="grelha-cartoes grelha-cartoes--5" role="list">
  ${c.espacos.map((e) => `<li class="cartao" id="${e.slug}">
    <span class="circulo-icone">${icone[e.icone]}</span>
    <h3>${esc(e.nome)}</h3>
    <p>${esc(e.linha)}</p>
    ${e.pagina === 'empresas' ? `<a class="ligacao-seta" href="${ctx.href('/empresas/')}">Para empresas ${icone.seta}</a>` : ''}
  </li>`).join('\n  ')}
</ul>` })}
${seccao({ id: 'tipos', rot: 'O que fazemos', titulo: 'Soluções completas de limpeza', corpo: `<div class="dividido">
  <div class="dividido__media">${foto(ctx, 'marca-limpeza', { sizes: '(min-width: 900px) 420px, 92vw' })}</div>
  <ul class="lista-check" role="list">
    ${c.tiposLimpeza.map((t) => `<li>${icone.check}<div><h3>${esc(t.nome)}</h3><p>${esc(t.linha)}</p></div></li>`).join('\n    ')}
  </ul>
</div>` })}
${seccao({ id: 'pos-obra', classe: 'seccao--ad', corpo: `<div class="ad-bloco ad-bloco--largo" id="antes-e-depois">
  <div class="ad-bloco__texto">
    ${rotulo('Limpeza pós-obra · antes e depois')}
    <h2 class="titulo-seccao" id="t-pos-obra">A obra termina. O nosso trabalho começa.</h2>
    <p>Removemos o pó e os resíduos da obra, limpamos a fundo todas as superfícies, os vidros, as caixilharias e os acabamentos, e entregamos o espaço pronto a usar. Uma moradia acabada de construir, antes e depois da nossa limpeza.</p>
    ${botaoPedido(ctx, 'posobra', 'Pedir orçamento para pós-obra', 'botao botao--linha')}
  </div>
  ${antesDepois(ctx, { pares: c.antesDepois, id: 'adl', sizes: '(min-width: 900px) 320px, 46vw' })}
</div>` })}
${seccao({ id: 'porque', rot: 'Porquê a NEVOA', titulo: 'Mais do que limpeza. Confiança.', corpo: porque(ctx) })}`;
  return {
    caminho: '/limpeza/',
    titulo: 'Limpeza profissional em Felgueiras e no distrito do Porto',
    ogTitulo: 'Limpeza profissional — NEVOA Premium Services',
    descricao: 'Limpeza de casas, condomínios, alojamento local, eventos e pós-obra em Felgueiras e em todo o distrito do Porto. Limpeza regular ou a fundo, com produtos profissionais. Orçamento sem compromisso.',
    seccao: 'limpeza',
    corpo,
    jsonLd: [migalhas(ctx, [['Limpeza profissional', '/limpeza/']])],
  };
}

function porque(ctx) {
  return `<ul class="grelha-cartoes grelha-cartoes--3" role="list">
  ${ctx.conteudo.porque.map((p) => `<li class="cartao cartao--simples"><span class="circulo-icone">${icone[p.icone]}</span><h3>${esc(p.nome)}</h3><p>${esc(p.linha)}</p></li>`).join('\n  ')}
</ul>`;
}

export function empresas(ctx) {
  const c = ctx.conteudo;
  const deEmpresa = c.espacos.filter((e) => e.pagina === 'empresas' || ['condominios', 'alojamento-local'].includes(e.slug));
  const corpo = `${cabecalho({
    rotuloTexto: 'Limpeza para empresas',
    titulo: 'O seu negócio merece um <span class="dourado">espaço à altura.</span>',
    frase: 'Escritórios, indústria, comércio, clínicas, ginásios e condomínios. Um parceiro de limpeza com um plano feito para a sua operação, com qualidade, confiança e discrição.',
    acoes: `${botaoPedido(ctx, 'empresa', 'Pedir uma proposta')}${botaoWhatsapp(ctx, 'WhatsApp', 'Olá! Gostava de pedir uma proposta de limpeza para a minha empresa.')}`,
  })}
${seccao({ id: 'espacos', rot: 'Onde trabalhamos', titulo: 'Soluções para todo o tipo de empresa', corpo: `<ul class="grelha-cartoes" role="list">
  ${deEmpresa.map((e) => `<li class="cartao" id="${e.slug}"><span class="circulo-icone">${icone[e.icone]}</span><h3>${esc(e.nome)}</h3><p>${esc(e.linha)}</p></li>`).join('\n  ')}
  <li class="cartao" id="espacos-partilhados"><span class="circulo-icone">${icone.pessoas}</span><h3>Espaços partilhados</h3><p>Casas de banho, copas, salas e áreas comuns.</p></li>
</ul>` })}
${seccao({ id: 'como-trabalhamos', rot: 'Como trabalhamos', titulo: 'Da avaliação ao acompanhamento', corpo: `<div class="dividido dividido--inverso">
  <ol class="passos" role="list">
    ${c.passosEmpresas.map((p, i) => `<li class="passo"><span class="passo__n">${String(i + 1).padStart(2, '0')}</span><div><h3>${esc(p.nome)}</h3><p>${esc(p.linha)}</p></div></li>`).join('\n    ')}
  </ol>
  <div class="dividido__media">${video(ctx, 'equipa', { rotulo: 'A equipa da NEVOA, de farda, a limpar' })}</div>
</div>` })}
${seccao({ id: 'porque', rot: 'Porquê a NEVOA', titulo: 'Mais do que limpeza, um parceiro', corpo: porque(ctx) })}`;
  return {
    caminho: '/empresas/',
    titulo: 'Limpeza para empresas, escritórios e indústria',
    ogTitulo: 'Limpeza para empresas — NEVOA Premium Services',
    descricao: 'Limpeza profissional de escritórios, indústria e armazéns, lojas, clínicas, ginásios e condomínios em Felgueiras e no distrito do Porto. Plano à medida e horários adaptados. Peça uma proposta.',
    seccao: 'empresas',
    corpo,
    jsonLd: [migalhas(ctx, [['Limpeza para empresas', '/empresas/']])],
  };
}

export function lavandaria(ctx) {
  const c = ctx.conteudo;
  const corpo = `${cabecalho({
    rotuloTexto: 'Lavandaria &amp; Engomadoria',
    titulo: 'Cuidamos das suas peças. <span class="dourado">Cuidamos do seu tempo.</span>',
    estado: '<span class="etiqueta etiqueta--breve">Abertura em breve, em Felgueiras</span>',
    frase: 'Lavar, secar e engomar, com recolha e entrega ao domicílio. Para particulares e empresas, na nossa nova loja de Felgueiras.',
    acoes: `${botaoPedido(ctx, 'lavandaria', 'Pedir informações')}${botaoWhatsapp(ctx, 'WhatsApp', 'Olá! Gostava de saber mais sobre a lavandaria da NEVOA.')}`,
  })}
${seccao({ id: 'o-que-tratamos', rot: 'O que tratamos', titulo: 'Todo o tipo de roupa, com o máximo cuidado', corpo: `<ul class="grelha-cartoes grelha-cartoes--4" role="list">
  ${c.roupa.map((r) => `<li class="cartao cartao--simples"><span class="circulo-icone">${icone[r.icone]}</span><h3>${esc(r.nome)}</h3><p>${esc(r.linha)}</p></li>`).join('\n  ')}
</ul>` })}
${seccao({ id: 'como-funciona', rot: 'Como funciona', titulo: 'Simples, cómodo e sem complicações', corpo: `<div class="dividido">
  <div class="dividido__media">${foto(ctx, 'marca-engomadoria', { sizes: '(min-width: 900px) 420px, 92vw' })}</div>
  <ol class="passos" role="list">
    ${c.passosLavandaria.map((p, i) => `<li class="passo"><span class="passo__n">${String(i + 1).padStart(2, '0')}</span><div><h3>${esc(p.nome)}</h3><p>${esc(p.linha)}</p></div></li>`).join('\n    ')}
  </ol>
</div>` })}
${seccao({ id: 'recolha', classe: 'seccao--recolha', corpo: `<div class="faixa">
  <span class="circulo-icone circulo-icone--grande">${icone.carrinha}</span>
  <div class="faixa__texto">
    ${rotulo('Recolha &amp; Entrega')}
    <h2 class="titulo-seccao" id="t-recolha">Nós vamos até si.</h2>
    <p>Escolha o dia e a hora. Recolhemos a roupa em sua casa ou na sua empresa, em Felgueiras e na região, tratamos de tudo e devolvemo-la pronta a usar.</p>
  </div>
  ${botaoPedido(ctx, 'lavandaria', 'Quero saber quando abre', 'botao botao--ouro')}
</div>` })}`;
  return {
    caminho: '/lavandaria/',
    titulo: 'Lavandaria e engomadoria com recolha e entrega em Felgueiras',
    ogTitulo: 'Lavandaria & Engomadoria — NEVOA Premium Services',
    descricao: 'Lavandaria e engomadoria em Felgueiras, com recolha e entrega ao domicílio: vestuário, roupa de casa, edredões, fardas e têxteis de alojamento. Abertura em breve.',
    seccao: 'lavandaria',
    corpo,
    ogImagem: null,
    jsonLd: [migalhas(ctx, [['Lavandaria & Engomadoria', '/lavandaria/']])],
  };
}

// ---------- a NEVOA ----------

export function sobre(ctx) {
  const { site } = ctx;
  const corpo = `<div class="sobre contentor">
  <div class="sobre__texto">
    ${rotulo('A NEVOA')}
    <h1 class="cab__titulo">Somos premium por escolha, <span class="dourado">e não por preço.</span></h1>
    <p class="cab__frase">Na NEVOA, ser premium não significa ser mais caro. Significa fazer melhor: cuidar de cada espaço como se fosse nosso, tratar cada peça de roupa com atenção, cumprir horários, responder a quem nos procura e não deixar nenhum detalhe ao acaso.</p>
    <ul class="factos" role="list">
      <li>${icone.estrela}<span><b>No terreno desde 1 de outubro de 2026</b>, com a limpeza profissional.</span></li>
      <li>${icone.local}<span><b>Casa em Felgueiras</b>, a servir todo o distrito do Porto.</span></li>
      <li>${icone.maquina}<span><b>Lavandaria e engomadoria</b> a abrir em breve, na mesma loja.</span></li>
    </ul>
    <div class="cab__acoes">${botaoPedido(ctx)}<a class="botao botao--linha" href="${site.mapa}" target="_blank" rel="noopener">Como chegar</a></div>
  </div>
  <figure class="sobre__foto">${foto(ctx, 'loja-letreiro', { sizes: '(min-width: 900px) 440px, 92vw', prioridade: true })}<figcaption>A nossa loja, na ${esc(site.morada.rua.replace(/, Lote.*$/, ''))}, em Felgueiras.</figcaption></figure>
</div>
${seccao({ id: 'compromisso', rot: 'O nosso compromisso', titulo: 'Dois serviços, um só padrão de excelência', corpo: porque(ctx) })}`;
  return {
    caminho: '/a-nevoa/',
    titulo: 'Quem somos',
    ogTitulo: 'A NEVOA — Premium Services em Felgueiras',
    descricao: 'A NEVOA Premium Services nasceu em Felgueiras para cuidar de espaços e de roupa com rigor, discrição e atenção ao detalhe. Somos premium por escolha, e não por preço.',
    seccao: 'sobre',
    precarregar: [{ srcset: srcsetFoto(ctx, 'loja-letreiro'), sizes: '(min-width: 900px) 440px, 92vw', fmt: 'avif' }],
    corpo,
    jsonLd: [migalhas(ctx, [['A NEVOA', '/a-nevoa/']])],
  };
}

// ---------- contactos e pedido de orçamento ----------

export function contactos(ctx) {
  const { site } = ctx;
  const wa = whatsappHref(site.whatsapp, 'Olá! Gostava de pedir um orçamento à NEVOA.');
  const empresa = site.empresa.firma
    ? `${esc(site.empresa.firma)} · NIF ${esc(site.empresa.nif)}`
    : 'Firma e NIF [por confirmar]';
  const corpo = `${cabecalho({ rotuloTexto: 'Contactos', titulo: 'Fale connosco. <span class="dourado">Tratamos do resto.</span>', frase: 'Contacto direto e resposta rápida. Diga-nos o que precisa e enviamos um orçamento à sua medida, sem compromisso.' })}
<section class="seccao seccao--contactos" aria-label="Formas de contacto">
  <div class="contentor contactos">
    <ul class="contactos__lista" role="list">
      ${wa ? `<li class="contacto"><span class="circulo-icone">${icone.whatsapp}</span><div><h2>WhatsApp</h2><a href="${wa}" target="_blank" rel="noopener">Enviar uma mensagem</a></div></li>` : ''}
      <li class="contacto"><span class="circulo-icone">${icone.telefone}</span><div><h2>Telefone</h2>${telefoneHtml(site.telefone, { frase: 'com-a' })}</div></li>
      <li class="contacto"><span class="circulo-icone">${icone.email}</span><div><h2>Email</h2><a href="mailto:${site.email}">${esc(site.email)}</a></div></li>
      <li class="contacto"><span class="circulo-icone">${icone.relogio}</span><div><h2>Horário</h2><p>${esc(site.horario.texto)}</p></div></li>
      <li class="contacto"><span class="circulo-icone">${icone.local}</span><div><h2>A nossa loja</h2><p>${esc(site.morada.rua)}<br>${esc(site.morada.codigoPostal)} ${esc(site.morada.localidade)}</p><a href="${site.mapa}" target="_blank" rel="noopener">Como chegar</a></div></li>
      <li class="contacto"><span class="circulo-icone">${icone.instagram}</span><div><h2>Instagram</h2><a href="https://www.instagram.com/${site.instagram}/" target="_blank" rel="noopener">@${esc(site.instagram)}</a></div></li>
    </ul>
    ${pedido(ctx)}
  </div>
</section>
${seccao({ id: 'zona', rot: 'Onde trabalhamos', titulo: esc(site.zona.resumo), sub: 'Felgueiras é a nossa base. Levamos a limpeza a casas, empresas, condomínios e alojamentos locais de todo o distrito do Porto; a recolha e entrega da lavandaria serve Felgueiras e a região.', corpo: `<ul class="fichas fichas--zona" role="list">${site.zona.concelhos.map((c) => `<li>${icone.local}${esc(c)}</li>`).join('')}</ul>
  <p class="identificacao">${esc(site.marca)} · ${empresa} · ${esc(site.morada.rua)}, ${esc(site.morada.codigoPostal)} ${esc(site.morada.localidade)}</p>` })}`;
  return {
    caminho: '/contactos/',
    titulo: 'Contactos e pedido de orçamento',
    ogTitulo: 'Contactos — NEVOA Premium Services',
    descricao: `Peça um orçamento de limpeza ou de lavandaria à NEVOA: WhatsApp, telefone ${site.telefone} ou ${site.email}. ${site.morada.rua}, ${site.morada.localidade}. ${site.horario.texto}.`,
    seccao: 'contactos',
    corpo,
    jsonLd: [migalhas(ctx, [['Contactos', '/contactos/']])],
  };
}

function pedido(ctx) {
  const { site } = ctx;
  return `<form class="pedido" id="pedido" data-pedido data-whatsapp="${esc(site.whatsapp || '')}" data-email="${esc(site.email)}" novalidate>
  <h2 class="pedido__titulo">Pedir orçamento</h2>
  <p class="pedido__nota">Escreva o pedido aqui e envie-o pelo WhatsApp ou por email, já escrito.</p>
  <fieldset class="pedido__servicos">
    <legend>O que precisa?</legend>
    <div class="escolhas">
      ${Object.entries(PEDIDOS).map(([k, t], i) => `<label class="escolha"><input type="radio" name="servico" value="${esc(t)}" data-tipo="${k}"${i === 0 ? ' checked' : ''}><span>${esc(t)}</span></label>`).join('\n      ')}
    </div>
  </fieldset>
  <div class="pedido__campos">
    <label class="campo"><span>O seu nome</span><input type="text" name="nome" autocomplete="name" required maxlength="80"></label>
    <label class="campo"><span>Localidade</span><input type="text" name="localidade" autocomplete="address-level2" placeholder="Ex.: Felgueiras" maxlength="60"></label>
  </div>
  <label class="campo"><span>Conte-nos o que precisa</span><textarea name="mensagem" rows="4" maxlength="1200" placeholder="O espaço, a área aproximada, a frequência e as datas que lhe dão jeito."></textarea></label>
  <p class="pedido__erro" role="alert" data-pedido-erro hidden>Escreva o seu nome, para sabermos a quem responder.</p>
  <div class="pedido__acoes">
    ${site.whatsapp ? `<button class="botao botao--ouro" type="submit" name="canal" value="whatsapp">${icone.whatsapp}Enviar pelo WhatsApp</button>` : ''}
    <button class="botao botao--linha" type="submit" name="canal" value="email">${icone.email}Enviar por email</button>
  </div>
</form>`;
}

// ---------- legais (fora do Google) ----------

export function privacidade(ctx) {
  const { site } = ctx;
  const quem = site.empresa.firma ? `${esc(site.empresa.firma)}, NIF ${esc(site.empresa.nif)}` : '[firma e NIF por confirmar]';
  const config = {
    alojamento: 'github-pages',
    email: 'outro',
    emailNome: 'O fornecedor do email @nevoaservices.pt [por confirmar]',
    whatsapp: Boolean(site.whatsapp),
    instagram: true,
    repositorioPublico: true,
  };
  const corpo = `${cabecalho({ rotuloTexto: 'Privacidade', titulo: 'Política de privacidade', frase: 'Como tratamos os dados de quem nos contacta.' })}
<div class="contentor texto">
  <h2>Quem é responsável</h2>
  <p>${esc(site.marca)} (${quem}), ${esc(site.morada.rua)}, ${esc(site.morada.codigoPostal)} ${esc(site.morada.localidade)}. Contacto: <a href="mailto:${site.email}">${esc(site.email)}</a>.</p>
  <h2>Que dados tratamos e para quê</h2>
  <p>Este site não tem contas, não usa cookies e não guarda nada do que escreve: o formulário do pedido de orçamento só prepara a mensagem, que envia por si pelo WhatsApp ou pelo seu email. Tratamos os dados que nos envia (nome, contacto, morada do serviço e o que nos conta) para responder ao pedido, fazer o orçamento e, se o aceitar, prestar e faturar o serviço.</p>
  <p>A base é o seu pedido e o contrato que daí resulte (RGPD, art. 6.º, n.º 1, alínea b)) e, na faturação, a obrigação legal (alínea c)).</p>
  <h2>Por quanto tempo</h2>
  <ul><li>${esc(prazos.pedidosDeContacto.texto)}</li><li>${esc(prazos.encomendas.texto.replace('Encomendas e facturas', 'Serviços prestados e faturas'))}</li></ul>
  <h2>Quem mais os vê</h2>
  ${destinatariosHtml(config, { formato: 'lista' })}
  ${frasesPrivacidade(config).map((f) => `<p>${esc(f)}</p>`).join('\n  ')}
  <h2>Os seus direitos</h2>
  ${direitosHtml({ email: site.email })}
</div>`;
  return { caminho: '/privacidade/', titulo: 'Política de privacidade', descricao: 'Política de privacidade da NEVOA Premium Services: que dados tratamos quando nos contacta, para quê, por quanto tempo e os seus direitos.', seccao: 'legal', legal: true, corpo };
}

export function litigios(ctx) {
  const corpo = `${cabecalho({ rotuloTexto: 'Resolução de litígios', titulo: 'Resolução alternativa de litígios', frase: 'Se não chegarmos a acordo sobre um serviço, estas são as entidades a que pode recorrer.' })}
<div class="contentor texto">
  ${ralHtml({ ambito: 'local', concelhos: ['Felgueiras', 'Porto'] })}
  <p>Pode também apresentar uma reclamação no <a href="https://www.livroreclamacoes.pt/inicio" target="_blank" rel="noopener">Livro de Reclamações Eletrónico</a>.</p>
</div>`;
  return { caminho: '/litigios/', titulo: 'Resolução de litígios', descricao: 'As entidades de resolução alternativa de litígios de consumo a que pode recorrer: TRIAVE, CICAP e CNIACC, e o Livro de Reclamações Eletrónico.', seccao: 'legal', legal: true, corpo };
}

export function naoEncontrada(ctx) {
  const corpo = `${cabecalho({ rotuloTexto: 'Erro 404', titulo: 'Esta página perdeu-se na névoa.', frase: 'O endereço pode estar errado ou a página já não existir.', acoes: `<a class="botao botao--ouro" href="${ctx.href('/')}">Ir para o início</a><a class="botao botao--linha" href="${ctx.href('/contactos/')}">Contactos</a>` })}`;
  return { caminho: '/404.html', titulo: 'Página não encontrada', descricao: 'A página que procura não existe. Volte ao início da NEVOA Premium Services ou fale connosco.', seccao: 'outra', legal: true, corpo };
}
