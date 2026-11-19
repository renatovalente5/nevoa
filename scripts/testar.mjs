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
console.log(`${paginas.length} páginas, ${ok} provas certas, ${falhas.length} falhas.`);
if (falhas.length) { console.log(falhas.slice(0, 40).join('\n')); process.exit(1); }
