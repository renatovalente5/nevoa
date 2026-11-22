#!/usr/bin/env node
// Provas do site construído (_site): cada página com título, descrição, um h1, canonical e og:image que existe;
// ligações internas e ficheiros referidos existem; legais com noindex; sem marcadores por resolver; as regras do
// Renato (rodapé «© ano Marca», nada de passos nem frase de fecho na página inicial, nota das chamadas, WhatsApp sem
// número, Livro de Reclamações no rodapé).
// O content/ é do João (muda pelo painel a toda a hora): as provas tiram o que esperam do próprio content/, pelas
// regras do gerador (src/lib/regras.mjs → paraOSite), e nunca afirmam o conteúdo de hoje (memória
// testes-do-site-com-conteudo-de-ensaio). scripts/testar-variantes.mjs prova-o com outro conteúdo.
//   node scripts/testar.mjs [--base=/nevoa]
//   node scripts/testar.mjs --producao --url=https://nevoagroup.pt   (mais: robots, sitemap, canonical e noindex)
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as R from '../src/lib/regras.mjs';
import { ICONES, ICONES_DOS_CARTOES } from '../src/lib/icones.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(RAIZ, '_site');
// o conteúdo como as páginas o usam (o que as regras tiram fica fora: as provas também não o esperam)
const lerTexto = (f) => readFileSync(join(RAIZ, f), 'utf8');
const textos = { site: lerTexto(R.FICHEIROS.site), servicos: lerTexto(R.FICHEIROS.servicos), fotos: lerTexto(R.FICHEIROS.fotos) };
const { site: S, servicos: C } = R.paraOSite(JSON.parse(textos.site), JSON.parse(textos.servicos), R.validar(textos));
const FOTOS = JSON.parse(textos.fotos);
// o texto de uma página para procurar o que se escreveu: sem etiquetas, com os espaços de agarrar como espaços
const escHtml = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plano = (html) => html.replace(/<[^>]+>/g, ' ').replace(/[\s\u00A0]+/g, ' ');
const tem = (html, t) => plano(html).includes(escHtml(t).replace(/[\s\u00A0]+/g, ' '));
const base = (process.argv.find((a) => a.startsWith('--base=')) || '--base=').slice(7).replace(/\/$/, '');
const paginas = [];
(function andar(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) { if (f !== 'assets') andar(p); } else if (f.endsWith('.html')) paginas.push(p); } })(SITE);

let ok = 0; const falhas = [];
const prova = (cond, msg) => { if (cond) ok++; else falhas.push(msg); };
const existe = (url) => {
  let caminho = url.split('#')[0].split('?')[0];
  if (base && caminho.startsWith(base)) caminho = caminho.slice(base.length);
  if (!caminho.startsWith('/')) return true;
  const f = join(SITE, decodeURIComponent(caminho));
  return existsSync(f) && (statSync(f).isFile() || existsSync(join(f, 'index.html')));
};

for (const p of paginas) {
  const rel = p.slice(SITE.length);
  const html = readFileSync(p, 'utf8');
  const legal = /\/(privacidade|litigios)\/|404\.html/.test(rel);
  const semScripts = html.replace(/<(script|style)[\s\S]*?<\/(script|style)>/g, '');
  const corpo = (semScripts.match(/<body[\s\S]*<\/body>/) || [''])[0];
  prova(/<title>[^<]{10,}<\/title>/.test(html), `${rel}: sem <title>`);
  prova(/<meta name="description" content="[^"]{60,}">/.test(html), `${rel}: descrição em falta ou curta`);
  prova((html.match(/<h1[\s>]/g) || []).length === 1, `${rel}: não tem exatamente um h1`);
  prova(/<html lang="pt-PT"/.test(html), `${rel}: língua`);
  prova(/<link rel="canonical" href="https?:\/\//.test(html), `${rel}: canonical`);
  prova(!/\{\{|\}\}|undefined|NaN|\[object Object\]|null</.test(semScripts), `${rel}: texto por resolver (undefined, null, {{ }})`);
  if (legal) prova(html.includes('<meta name="robots" content="noindex">'), `${rel}: legal sem noindex`);
  const og = (html.match(/<meta property="og:image" content="([^"]+)"/) || [])[1];
  prova(og && existe(new URL(og).pathname), `${rel}: og:image em falta (${og})`);
  for (const m of html.matchAll(/(?:href|src|poster|data-src)="([^"]+)"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|tel:|#|data:)/.test(u)) continue;
    prova(existe(u), `${rel}: ligação partida ${u}`);
  }
  for (const m of html.matchAll(/(?:srcset|imagesrcset)="([^"]+)"/g)) for (const parte of m[1].split(',')) { const u = parte.trim().split(' ')[0]; prova(existe(u), `${rel}: imagem em falta ${u}`); }
  // âncoras internas da mesma página
  for (const m of html.matchAll(/href="#([^"]+)"/g)) if (!/^pedido/.test(m[1])) prova(html.includes(`id="${m[1]}"`), `${rel}: âncora #${m[1]} sem destino`);
  prova(html.includes('livroreclamacoes.pt'), `${rel}: sem o Livro de Reclamações no rodapé`);
  prova(/\(Chamada para a rede (móvel|fixa) nacional\)/.test(html), `${rel}: telefone sem a nota da chamada`);
  prova(!new RegExp(`WhatsApp[^<]{0,40}${S.telefone}`).test(corpo), `${rel}: o WhatsApp mostra o número (só a ligação)`);
  prova(/<p>© \d{4} NEVOA Premium Services<\/p>/.test(html), `${rel}: linha do © diferente de «© ano Marca»`);
  prova(!/NIF \d|\b\d{9}\b(?![^<]*telefone)/.test(html.match(/<footer[\s\S]*<\/footer>/)?.[0].replace(/tel:\+351\d+/g, '').split(S.telefone).join('') || ''), `${rel}: o rodapé tem NIF ou outros dados da empresa`);
  prova(!/soluções sustentáveis|ecológic|amigo do ambiente/i.test(semScripts), `${rel}: alegação ambiental genérica`);
  prova(!/qualidade garantida|garantia de/i.test(semScripts), `${rel}: promessa de garantia`);
}
// a página inicial: sem secção de passos nem frase de fecho (regra do Renato), com os dados do negócio
for (const ini of ['index.html', 'propostas/b/index.html', 'propostas/c/index.html'].map((f) => join(SITE, f)).filter(existsSync)) {
  const html = readFileSync(ini, 'utf8');
  prova(!/class="passos"|como funciona|do pedido à entrega/i.test(html), `${ini}: página inicial com secção de passos`);
  prova(html.includes('"@type":"LocalBusiness"'), `${ini}: dados estruturados do negócio`);
}

// o que o João (dono da NEVOA) pediu a 21 nov 2026
const ler = (f) => (existsSync(join(SITE, f)) ? readFileSync(join(SITE, f), 'utf8') : '');
const divisoes = JSON.parse(readFileSync(join(RAIZ, 'content', 'servicos.json'), 'utf8')).divisoes;
const inicio = ler('index.html');
for (const d of divisoes) {
  prova(inicio.includes(`>${d.nome}</a></h3>`), `início: falta o cartão da ${d.nome}`);
  prova(inicio.includes(`href="${base}${d.pagina}"`), `início: o cartão da ${d.nome} não leva a ${d.pagina}`);
  prova(existsSync(join(SITE, d.pagina, 'index.html')), `${d.pagina}: a página da ${d.nome} não existe`);
  prova(ler(d.pagina.slice(1) + 'index.html').includes(d.nome), `${d.pagina}: a página não diz «${d.nome}»`);
  for (const p of paginas) prova(readFileSync(p, 'utf8').includes(`>${d.nome}</a></li>`), `${p.slice(SITE.length)}: o rodapé não tem a ${d.nome}`);
}
prova(inicio.includes(`<p class="rotulo">${C.divisoes.map((d) => escHtml(d.curto)).join(' · ')}</p>`), 'início: o sobretítulo da capa não tem as divisões');
const intro = inicio.match(/data-horizontal="([^"]+)" data-vertical="([^"]+)"/);
prova(intro && existe(intro[1]) && existe(intro[2]), 'início: a intro não tem os dois vídeos');
prova(!/data-intro/.test(ler('limpeza/index.html')), 'a intro só vai na página inicial');
// os espaços (os cartões do João): todos na Limpeza e na página inicial; nas Empresas, os que dizem «empresas»; o atalho
// da página inicial leva à página onde o cartão está
for (const e of C.espacos) {
  prova(tem(ler('limpeza/index.html'), e.nome) && ler('limpeza/index.html').includes(`id="${e.slug}"`), `limpeza: falta o espaço «${e.nome}»`);
  prova(tem(inicio, e.nome) && inicio.includes(`href="${base}${e.empresas ? '/empresas/' : '/limpeza/'}#${e.slug}"`), `início: o atalho do espaço «${e.nome}»`);
  prova(ler('empresas/index.html').includes(`id="${e.slug}"`) === e.empresas, `empresas: o espaço «${e.nome}» ${e.empresas ? 'falta' : 'não devia estar lá'}`);
}
// as outras listas, cada uma na sua página, pela ordem do conteúdo
for (const [lista, pagina] of [['tiposLimpeza', 'limpeza'], ['porque', 'limpeza'], ['passosEmpresas', 'empresas'], ['roupa', 'lavandaria'], ['passosLavandaria', 'lavandaria'], ['passosExpress', 'recolhas-e-entregas'], ['pilares', 'a-nevoa']]) {
  const html = plano(ler(`${pagina}/index.html`));
  const lugares = C[lista].map((x) => html.indexOf(escHtml(x.nome).replace(/[\s\u00A0]+/g, ' ')));
  prova(lugares.every((l) => l >= 0) && lugares.every((l, i) => !i || l > lugares[i - 1]), `${pagina}: a lista «${R.LISTAS[lista].nome}» não está toda, pela ordem`);
  prova(C[lista].every((x) => html.includes(escHtml(x.linha).replace(/[\s\u00A0]+/g, ' '))), `${pagina}: faltam frases de «${R.LISTAS[lista].nome}»`);
}
// a zona, a morada, o horário e a firma, como estão no content/
const contactos = ler('contactos/index.html');
prova(tem(contactos, S.zona.titulo) && tem(contactos, S.zona.frase), 'contactos: a zona não é a do content/');
prova(tem(contactos, S.horario.texto) && S.horario.curto && tem(inicio, S.horario.curto), 'contactos e início: o horário não é o do content/');
prova(tem(contactos, S.morada.codigoPostal) && tem(contactos, S.morada.localidade), 'contactos: a morada não é a do content/');
prova(S.empresa.firma ? tem(contactos, `${S.empresa.firma} · NIF ${S.empresa.nif}`) : tem(contactos, 'Firma e NIF [por confirmar]'), 'contactos: a firma e o NIF');
prova(S.empresa.firma ? tem(ler('privacidade/index.html'), `${S.empresa.firma}, NIF ${S.empresa.nif}`) : tem(ler('privacidade/index.html'), '[firma e NIF por confirmar]'), 'privacidade: a firma e o NIF');
prova(Boolean(S.whatsapp) === /wa\.me\//.test(contactos), 'contactos: o WhatsApp aparece sem número, ou falta com número');
// o antes e depois: todos os pares na Limpeza, os quatro primeiros na página inicial, cada um com as duas fotografias
const limpezaHtml = ler('limpeza/index.html');
for (const [i, p] of C.antesDepois.entries()) {
  prova(limpezaHtml.includes(`id="adl-${p.slug}"`) && tem(limpezaHtml, p.nome), `limpeza: falta o par «${p.nome}»`);
  prova(inicio.includes(`id="ad-${p.slug}"`) === (i < 4), `início: o par «${p.nome}» ${i < 4 ? 'falta' : 'não devia estar lá (só os quatro primeiros)'}`);
  for (const lado of ['antes', 'depois']) prova(limpezaHtml.includes(`alt="${escHtml(FOTOS[p[lado]].alt)}"`), `limpeza: o ${lado} de «${p.nome}» não é a fotografia ${p[lado]}`);
}
// as fotografias fixas: cada lugar mostra a fotografia que o content/ diz
prova(inicio.includes(`alt="${escHtml(FOTOS[S.fotos.fachada].alt)}"`), 'início: a casa não mostra a fotografia «A loja por fora»');
prova(ler('a-nevoa/index.html').includes(`alt="${escHtml(FOTOS[S.fotos.letreiro].alt)}"`), 'a NEVOA: não mostra a fotografia «A loja por dentro»');
prova(ler('empresas/index.html').includes(`alt="${escHtml(FOTOS[S.fotos.empresas].alt)}"`), 'empresas: não mostra a fotografia «Para as empresas»');
// as miniaturas do painel: de cada fotografia da biblioteca, com o nome fixo
for (const nome of Object.keys(FOTOS)) for (const tipo of ['miniatura', 'grande']) prova(existsSync(join(SITE, 'assets', 'fotos', `${tipo}-${nome}.webp`)), `painel: falta assets/fotos/${tipo}-${nome}.webp`);
// os ícones dos cartões: os que as regras aceitam são os que o site desenha
prova(JSON.stringify(R.NOMES_DOS_ICONES) === JSON.stringify(Object.keys(ICONES_DOS_CARTOES)) && R.NOMES_DOS_ICONES.every((n) => ICONES[n]), 'os ícones das regras e os do site não batem (src/lib/regras.mjs e src/lib/icones.mjs)');
// a revisão de 21 nov: títulos sem palavras curtas soltas nem hífen partido; legais no Acordo Ortográfico; rodapé sem contactos repetidos
prova(/perdeu-se<\/span>/.test(ler('404.html')) && /class="nw">perdeu-se/.test(ler('404.html')), '404: «perdeu-se» pode partir no hífen');
for (const f of ['privacidade/index.html', 'litigios/index.html']) prova(!/rectifica|afect|Protec|actualiza|co-responsab/.test(ler(f)), `${f}: grafia antiga`);
prova(!/por indicar|Facebook e\/ou/.test(ler('privacidade/index.html')), 'privacidade: marcas por preencher no email ou no Facebook');
for (const p of paginas) prova(!/rodape__contactos/.test(readFileSync(p, 'utf8')), `${p.slice(SITE.length)}: o rodapé voltou a ter a coluna dos contactos`);
prova(!/Uma só NEVOA/.test(inicio), 'início: voltou o «Uma só NEVOA»');
for (const p of paginas) prova(!/todo o distrito do Porto|distrito do Porto\.<\/p>|Felgueiras e distrito do Porto/.test(readFileSync(p, 'utf8')), `${p.slice(SITE.length)}: ainda diz só o distrito do Porto`);
prova(/CIAB/.test(ler('litigios/index.html')), 'litígios: falta o CIAB (distrito de Braga)');
// o estado de cada divisão (o João abre a lavandaria e as recolhas no painel): a etiqueta na página e no cartão, e o
// «em breve» das descrições só enquanto não abrem
for (const d of C.divisoes) {
  const pag = ler(d.pagina.slice(1) + 'index.html');
  const breve = d.estado === 'em-breve';
  if (d.slug !== 'cleaning') prova(pag.includes(breve ? 'etiqueta--breve' : 'etiqueta--ativo'), `${d.pagina}: a etiqueta não diz «${R.ESTADOS[d.estado]}»`);
  const desc = (pag.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  if (d.slug !== 'cleaning') prova(/em breve/i.test(desc) === breve, `${d.pagina}: a descrição ${breve ? 'devia' : 'não devia'} dizer «em breve»`);
}
const lav = C.divisoes.find((d) => d.slug === 'laundry').estado === 'ativo';
// só a frase da capa: a descrição para o Google é texto do João (o painel lembra-o, se ficar a dizer «em breve»)
const fraseDaCapa = (inicio.match(/<p class="capa__frase">([\s\S]*?)<\/p>/) || [])[1] ?? '';
prova(fraseDaCapa && /Em breve, lavandaria/.test(fraseDaCapa) === !lav, `início: a frase da capa ${lav ? 'ainda diz' : 'já não diz'} que a lavandaria abre em breve`);
prova(/name="servico" value="Recolhas e entregas"/.test(ler('contactos/index.html')), 'contactos: o pedido não tem as recolhas e entregas');
// produção (nevoagroup.pt): indexável, com robots e sitemap; as legais e o 404 com noindex e fora do sitemap
if (process.argv.includes('--producao')) {
  const url = (process.argv.find((a) => a.startsWith('--url=')) || '--url=').slice(6).replace(/\/$/, '');
  prova(/^https:\/\/[a-z0-9.-]+$/.test(url), `--url=${url}: endereço do domínio em falta`);
  const robots = existsSync(join(SITE, 'robots.txt')) ? readFileSync(join(SITE, 'robots.txt'), 'utf8') : '';
  prova(robots.includes(`Sitemap: ${url}/sitemap.xml`), 'robots.txt: sem a linha do sitemap');
  prova(!/Disallow:\s*\//.test(robots), 'robots.txt: bloqueia páginas (o Google tem de ler o noindex das legais)');
  const mapa = existsSync(join(SITE, 'sitemap.xml')) ? readFileSync(join(SITE, 'sitemap.xml'), 'utf8') : '';
  const locs = [...mapa.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  prova(locs.length >= 7, `sitemap: só ${locs.length} páginas`);
  for (const l of locs) prova(l.startsWith(url + '/') && existsSync(join(SITE, new URL(l).pathname, 'index.html')), `sitemap: ${l} não existe em ${url}`);
  // as datas do mapa vêm do git, com hora e fuso (com só o dia, duas publicações no mesmo dia não se distinguiam)
  const datasMapa = [...mapa.matchAll(/<url><loc>[^<]+<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?<\/url>/g)].map((m) => m[1] || '');
  prova(datasMapa.length === locs.length && datasMapa.every((d) => /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d([+-]\d\d:\d\d|Z)$/.test(d)), `sitemap: páginas sem <lastmod> do git (${datasMapa.join(', ')})`);
  // o Bing (ficheiro de verificação da conta) e a chave do IndexNow, na raiz
  const verif = JSON.parse(readFileSync(join(RAIZ, 'content', 'site.json'), 'utf8')).verificacoes;
  prova(ler('BingSiteAuth.xml').includes(`<user>${verif.bing}</user>`), 'BingSiteAuth.xml em falta ou com outro código');
  prova(/^[0-9a-f]{32}$/.test(verif.indexnow) && ler(`${verif.indexnow}.txt`) === verif.indexnow, 'a chave do IndexNow não está na raiz');
  // o negócio para o Google: logótipo quadrado de 512 px, horário legível, imagens que existem; o ícone de 192 px
  const negocioLd = [...inicio.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])).find((j) => j['@type'] === 'LocalBusiness') || {};
  const png = existsSync(join(SITE, 'icone-512.png')) ? readFileSync(join(SITE, 'icone-512.png')) : Buffer.alloc(24);
  prova(negocioLd.logo === `${url}/icone-512.png` && png.readUInt32BE(16) === 512 && png.readUInt32BE(20) === 512, `negócio: o logótipo (${negocioLd.logo}) não é o emblema de 512 px`);
  prova(Array.isArray(negocioLd.openingHoursSpecification) && negocioLd.openingHoursSpecification.every((h) => h.dayOfWeek?.length && /^\d\d:\d\d$/.test(h.opens) && /^\d\d:\d\d$/.test(h.closes)), 'negócio: horário (openingHoursSpecification) em falta');
  for (const i of [].concat(negocioLd.image || [])) prova(i.startsWith(url + '/') && existsSync(join(SITE, new URL(i).pathname)), `negócio: a imagem ${i} não existe`);
  for (const p of paginas) prova(readFileSync(p, 'utf8').includes('<link rel="icon" href="/icone-192.png" sizes="192x192"'), `${p.slice(SITE.length)}: sem o ícone de 192 px (o Google quer múltiplos de 48)`);
  for (const p of paginas) {
    const rel = p.slice(SITE.length);
    const html = readFileSync(p, 'utf8');
    const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1] || '';
    prova(canonical.startsWith(url + '/'), `${rel}: canonical ${canonical} fora de ${url}`);
    prova(!html.includes('/propostas/'), `${rel}: a barra das propostas foi para produção`);
    if (/\/(privacidade|litigios)\/|404\.html/.test(rel)) prova(!locs.includes(canonical), `${rel}: legal no sitemap`);
    else { prova(!html.includes('name="robots"'), `${rel}: noindex em produção`); prova(locs.includes(canonical), `${rel}: falta no sitemap`); }
  }
}
console.log(`${paginas.length} páginas, ${ok} provas certas, ${falhas.length} falhas.`);
if (falhas.length) { console.log(falhas.slice(0, 40).join('\n')); process.exit(1); }
