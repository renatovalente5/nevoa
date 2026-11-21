#!/usr/bin/env node
// Provas do site construído (_site): cada página com título, descrição, um h1, canonical e og:image que existe;
// ligações internas e ficheiros referidos existem; legais com noindex; sem marcadores por resolver; as regras do
// Renato (rodapé «© ano Marca», nada de passos nem frase de fecho na página inicial, nota das chamadas, WhatsApp sem
// número, Livro de Reclamações no rodapé).
//   node scripts/testar.mjs [--base=/nevoa]
//   node scripts/testar.mjs --producao --url=https://nevoagroup.pt   (mais: robots, sitemap, canonical e noindex)
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(RAIZ, '_site');
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
  prova(/\(Chamada para a rede móvel nacional\)/.test(html), `${rel}: telefone sem a nota da chamada`);
  prova(!/WhatsApp[^<]{0,40}910 079 994/.test(corpo), `${rel}: o WhatsApp mostra o número (só a ligação)`);
  prova(/<p>© \d{4} NEVOA Premium Services<\/p>/.test(html), `${rel}: linha do © diferente de «© ano Marca»`);
  prova(!/NIF \d|\b\d{9}\b(?![^<]*telefone)/.test(html.match(/<footer[\s\S]*<\/footer>/)?.[0].replace(/tel:\+351\d+|910 079 994/g, '') || ''), `${rel}: o rodapé tem NIF ou outros dados da empresa`);
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
prova(/<p class="rotulo">Cleaning · Laundry · Express<\/p>/.test(inicio), 'início: o sobretítulo da capa não tem as divisões');
const intro = inicio.match(/data-horizontal="([^"]+)" data-vertical="([^"]+)"/);
prova(intro && existe(intro[1]) && existe(intro[2]), 'início: a intro não tem os dois vídeos');
prova(!/data-intro/.test(ler('limpeza/index.html')), 'a intro só vai na página inicial');
for (const f of ['limpeza/index.html', 'empresas/index.html']) prova(/Espaços de[\s\u00A0]coworking/.test(ler(f)), `${f}: falta o coworking`);
for (const f of ['limpeza/index.html', 'empresas/index.html', 'index.html']) prova(/Centros empresariais/.test(ler(f)) && /Unidades hoteleiras/.test(ler(f)), `${f}: faltam os centros empresariais ou a hotelaria`);
prova(/distritos do Porto e de Braga/.test(ler('contactos/index.html')) && /qualquer parte do[\s\u00A0]Norte/.test(ler('contactos/index.html')), 'contactos: a zona não tem o Norte e Braga');
// a revisão de 21 nov: títulos sem palavras curtas soltas nem hífen partido; legais no Acordo Ortográfico; rodapé sem contactos repetidos
prova(/perdeu-se<\/span>/.test(ler('404.html')) && /class="nw">perdeu-se/.test(ler('404.html')), '404: «perdeu-se» pode partir no hífen');
for (const f of ['privacidade/index.html', 'litigios/index.html']) prova(!/rectifica|afect|Protec|actualiza|co-responsab/.test(ler(f)), `${f}: grafia antiga`);
prova(!/por indicar|Facebook e\/ou/.test(ler('privacidade/index.html')), 'privacidade: marcas por preencher no email ou no Facebook');
for (const p of paginas) prova(!/rodape__contactos/.test(readFileSync(p, 'utf8')), `${p.slice(SITE.length)}: o rodapé voltou a ter a coluna dos contactos`);
prova(!/Uma só NEVOA/.test(inicio), 'início: voltou o «Uma só NEVOA»');
for (const p of paginas) prova(!/todo o distrito do Porto|distrito do Porto\.<\/p>|Felgueiras e distrito do Porto/.test(readFileSync(p, 'utf8')), `${p.slice(SITE.length)}: ainda diz só o distrito do Porto`);
prova(/CIAB/.test(ler('litigios/index.html')), 'litígios: falta o CIAB (distrito de Braga)');
prova(/em breve/i.test(ler('lavandaria/index.html')) && /Em breve/.test(inicio), 'a lavandaria deixou de dizer «Em breve»');
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
