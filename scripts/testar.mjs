#!/usr/bin/env node
// Provas do site construído (_site): cada página com título, descrição, um h1, canonical e og:image que existe;
// ligações internas e ficheiros referidos existem; legais com noindex; sem marcadores por resolver; as regras do
// Renato (rodapé «© ano Marca», nada de passos nem frase de fecho na página inicial, nota das chamadas, WhatsApp sem
// número, Livro de Reclamações no rodapé).
//   node scripts/testar.mjs [--base=/nevoa]
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
for (const f of ['limpeza/index.html', 'empresas/index.html']) prova(/Espaços de coworking/.test(ler(f)), `${f}: falta o coworking`);
for (const f of ['limpeza/index.html', 'empresas/index.html', 'index.html']) prova(/Centros empresariais/.test(ler(f)) && /Unidades hoteleiras/.test(ler(f)), `${f}: faltam os centros empresariais ou a hotelaria`);
prova(/Distrito de Braga/.test(ler('contactos/index.html')) && /qualquer parte do Norte/.test(ler('contactos/index.html')), 'contactos: a zona não tem o Norte e Braga');
for (const p of paginas) prova(!/todo o distrito do Porto|distrito do Porto\.<\/p>|Felgueiras e distrito do Porto/.test(readFileSync(p, 'utf8')), `${p.slice(SITE.length)}: ainda diz só o distrito do Porto`);
prova(/CIAB/.test(ler('litigios/index.html')), 'litígios: falta o CIAB (distrito de Braga)');
prova(/em breve/i.test(ler('lavandaria/index.html')) && /Em breve/.test(inicio), 'a lavandaria deixou de dizer «Em breve»');
prova(/name="servico" value="Recolhas e entregas"/.test(ler('contactos/index.html')), 'contactos: o pedido não tem as recolhas e entregas');
console.log(`${paginas.length} páginas, ${ok} provas certas, ${falhas.length} falhas.`);
if (falhas.length) { console.log(falhas.slice(0, 40).join('\n')); process.exit(1); }
