#!/usr/bin/env node
// Constrói o site em _site/ a partir de content/, media/ (via .cache/imagens) e src/.
//
//   node scripts/build.mjs                       pré-visualização local (base /, noindex)
//   node scripts/build.mjs --base=/nevoa --url=https://renatovalente5.github.io/nevoa
//   node scripts/build.mjs --producao --url=https://nevoagroup.pt   (indexável, com sitemap; o domínio do grupo)
//
// A proposta escolhida (content/site.json → "variante"; o Renato escolheu a A «Névoa» a 19 nov 2026) é o site.
// O grupo (21 nov 2026, o João, dono da NEVOA): as divisões estão em content/servicos.json → divisoes; a intro são os
// vídeos do logótipo dele (media/intro/), só na página inicial.
// Só com --propostas (localmente, para comparar) as outras duas ficam inteiras em /propostas/<letra>/ e todas as
// páginas levam a barra para trocar.
//
// Antes: python3 scripts/imagens.py (gera .cache/imagens e o manifesto).
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { criarContexto, partilhaMarca } from '../src/templates/util.mjs';
import { pagina, VARIANTES } from '../src/templates/layout.mjs';
import * as P from '../src/templates/paginas.mjs';
import { livroCss } from '../legal-comum/index.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.split('=').slice(1).join('=') : d; };
const producao = process.argv.includes('--producao');
const opcoes = {
  base: (arg('base', '') || '').replace(/\/$/, ''),
  url: arg('url', 'http://127.0.0.1:5210').replace(/\/$/, ''),
  producao,
  preview: !producao,
  propostas: !producao && process.argv.includes('--propostas'),
  saida: join(RAIZ, arg('saida', '_site')),
};

const ler = (f) => JSON.parse(readFileSync(join(RAIZ, f), 'utf8'));
const site = ler('content/site.json');
const conteudo = ler('content/servicos.json');
const fotos = ler('content/fotos.json');
opcoes.padrao = site.variante;
const CACHE = join(RAIZ, '.cache', 'imagens');
if (!existsSync(join(CACHE, 'manifesto.json'))) throw new Error('Falta .cache/imagens/manifesto.json: corre primeiro python3 scripts/imagens.py');
const manifesto = JSON.parse(readFileSync(join(CACHE, 'manifesto.json'), 'utf8'));

// ---- verificações do conteúdo (a construção pára com a lista do que está mal) ----
const erros = [];
if (!VARIANTES[site.variante]) erros.push(`site.json: variante «${site.variante}» desconhecida (a, b ou c)`);
for (const [n, f] of Object.entries(fotos)) {
  if (!f.alt || f.alt.length < 12) erros.push(`fotografia ${n}: descrição em falta ou curta`);
  if (!manifesto.fotos[n]) erros.push(`fotografia ${n}: não está no manifesto (corre scripts/imagens.py)`);
}
for (const p of conteudo.antesDepois) for (const lado of ['antes', 'depois']) if (!fotos[`posobra-${p.slug}-${lado}`]) erros.push(`antes e depois «${p.slug}»: falta a fotografia ${lado}`);
for (const v of ['vidros', 'equipa']) if (!manifesto.videos[v]) erros.push(`vídeo ${v}: não está no manifesto`);
for (const d of conteudo.divisoes) {
  if (!d.nome || !d.curto || !d.area || !/^\/[a-z-]+\/$/.test(d.pagina || '')) erros.push(`divisão ${d.slug}: falta o nome, o curto, a área ou a página`);
  if (!['ativo', 'em-breve'].includes(d.estado)) erros.push(`divisão ${d.slug}: estado «${d.estado}» (ativo ou em-breve)`);
  if (d.foto && !fotos[d.foto]) erros.push(`divisão ${d.slug}: a fotografia ${d.foto} não existe`);
  if (!d.video && !d.foto && !d.icone) erros.push(`divisão ${d.slug}: sem vídeo, fotografia nem ícone para o cartão`);
  if (d.video && !manifesto.videos[d.video]) erros.push(`divisão ${d.slug}: o vídeo ${d.video} não existe`);
}
for (const e of conteudo.espacos) if (!['limpeza', 'empresas'].includes(e.pagina)) erros.push(`espaço ${e.slug}: página «${e.pagina}»`);
for (const f of ['horizontal', 'vertical']) if (!existsSync(join(RAIZ, 'media', 'intro', f + '.mp4'))) erros.push(`intro: falta media/intro/${f}.mp4`);
if (!/^\d{3} \d{3} \d{3}$/.test(site.telefone)) erros.push(`site.json: telefone «${site.telefone}» (formato 9xx xxx xxx)`);
if (erros.length) { console.error('O conteúdo tem problemas:\n- ' + erros.join('\n- ')); process.exit(1); }

// ---- saída limpa ----
rmSync(opcoes.saida, { recursive: true, force: true });
for (const d of ['assets/img', 'assets/video', 'assets/fontes']) mkdirSync(join(opcoes.saida, d), { recursive: true });
const resumo = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 10);

// letras e ficheiros com resumo no nome (o GitHub Pages guarda 10 min em cache e não deixa mudar os cabeçalhos)
const fontes = {};
for (const f of readdirSync(join(RAIZ, 'src', 'fontes')).filter((x) => x.endsWith('.woff2'))) {
  const buf = readFileSync(join(RAIZ, 'src', 'fontes', f));
  const nome = f.replace('.woff2', `-${resumo(buf)}.woff2`);
  writeFileSync(join(opcoes.saida, 'assets', 'fontes', nome), buf);
  fontes[f] = nome;
}
const cssFontes = `@font-face{font-family:"Gantari";src:url("fontes/${fontes['gantari-normal-latin.woff2']}") format("woff2");font-style:normal;font-weight:100 900;font-display:swap}`;
const css = [cssFontes, livroCss(), readFileSync(join(RAIZ, 'src', 'estilos', 'site.css'), 'utf8')].join('\n');
const assets = { fonte: fontes['gantari-normal-latin.woff2'] };
const escreverAsset = (chave, conteudoTxt, ext) => {
  const nome = `${chave}-${resumo(conteudoTxt)}.${ext}`;
  writeFileSync(join(opcoes.saida, 'assets', nome), conteudoTxt);
  assets[chave === 'site' && ext === 'css' ? 'css' : chave === 'site' ? 'js' : chave] = nome;
};
escreverAsset('site', css, 'css');
escreverAsset('site', readFileSync(join(RAIZ, 'src', 'scripts', 'site.js'), 'utf8'), 'js');
// a névoa (A) e o vidro (C) só vão quando essa proposta é construída
const variantes = opcoes.propostas ? [site.variante, ...Object.keys(VARIANTES).filter((k) => k !== site.variante)] : [site.variante];
if (variantes.includes('a')) escreverAsset('nevoa', readFileSync(join(RAIZ, 'src', 'scripts', 'nevoa.js'), 'utf8'), 'js');
if (variantes.includes('c')) escreverAsset('vidro', readFileSync(join(RAIZ, 'src', 'scripts', 'vidro.js'), 'utf8'), 'js');
// a intro: os dois vídeos do logótipo (deitado para o computador, ao alto para o telemóvel), com resumo no nome
assets.intro = {};
for (const f of ['horizontal', 'vertical']) {
  const buf = readFileSync(join(RAIZ, 'media', 'intro', f + '.mp4'));
  const nome = `intro-${f}-${resumo(buf)}.mp4`;
  writeFileSync(join(opcoes.saida, 'assets', 'video', nome), buf);
  assets.intro[f] = nome;
}

// ---- páginas, por proposta ----
const usados = new Set();
const escrever = (caminho, html) => {
  const destino = caminho.endsWith('.html') ? join(opcoes.saida, caminho) : join(opcoes.saida, caminho, 'index.html');
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, html.normalize('NFC'));
};
// Tipografia dos títulos (h1–h3): as palavras curtas («e», «o», «à», «um», «até»…) agarram-se à seguinte, para não
// ficarem sozinhas no fim da linha («por escolha, e / não por preço»), e as palavras com hífen não partem no hífen
// («perdeu- / se»). Só no texto, nunca dentro das etiquetas.
const CURTAS = /(^|[\s>(«])(e|o|a|os|as|é|à|às|ao|aos|um|uma|de|do|da|em|no|na|se|só|até) (?=[^\s<])/giu;
const tipografiaTexto = (t) => t.replace(CURTAS, '$1$2 ').replace(CURTAS, '$1$2 ').replace(/([\p{L}\d]+(?:-[\p{L}\d]+)+)/gu, '<span class="nw">$1</span>');
const tipografia = (html) => html.replace(/<(h[123])([^>]*)>([\s\S]*?)<\/\1>/g, (_, tag, attrs, dentro) =>
  `<${tag}${attrs}>${dentro.split(/(<[^>]+>)/).map((parte) => (parte.startsWith('<') ? parte : tipografiaTexto(parte))).join('')}</${tag}>`);
// As páginas legais vêm do legal-comum, ainda na grafia antiga: aqui ficam no Acordo Ortográfico, como o resto do site.
const AO90 = { rectificação: 'retificação', afectar: 'afetar', 'Protecção': 'Proteção', protecção: 'proteção', actualizada: 'atualizada', actualizado: 'atualizado', 'co-responsabilidade': 'corresponsabilidade', efectuar: 'efetuar', objecto: 'objeto', direcção: 'direção', colectiva: 'coletiva' };
const ortografia = (html) => html.replace(new RegExp(Object.keys(AO90).join('|'), 'g'), (m) => AO90[m]);

let nPaginas = 0;
const todas = [];
for (const variante of variantes) {
  const prefixo = variante === site.variante ? '' : `/propostas/${variante}`;
  const ctx = criarContexto({ base: opcoes.base, raiz: opcoes.base + prefixo, url: opcoes.url, manifesto, fotos, usados });
  Object.assign(ctx, { site, conteudo, opcoes, assets, variante });
  ctx.partilhaMarca = partilhaMarca(ctx);
  const paginas = [P.inicio(ctx), P.limpeza(ctx), P.empresas(ctx), P.lavandaria(ctx), P.express(ctx), P.sobre(ctx), P.contactos(ctx), P.privacidade(ctx), P.litigios(ctx)];
  if (!prefixo) paginas.push(P.naoEncontrada(ctx));
  for (const p of paginas) {
    let html = tipografia(pagina(ctx, p));
    if (p.ortografia) html = ortografia(html);
    escrever(prefixo + p.caminho, html);
    nPaginas++;
    if (!prefixo) todas.push({ ...p, abs: ctx.absPagina(p.caminho) });
  }
}

// ---- imagens e vídeos usados ----
let nImg = 0, nVid = 0;
for (const f of usados) {
  if (f.startsWith('video:')) {
    const [orig, destino] = f.slice(6).split('>');
    copyFileSync(join(RAIZ, 'media', 'videos', orig), join(opcoes.saida, 'assets', 'video', destino)); nVid++;
  } else {
    const origem = join(CACHE, f);
    if (!existsSync(origem)) throw new Error(`Falta na cache: ${f} (corre python3 scripts/imagens.py)`);
    copyFileSync(origem, join(opcoes.saida, 'assets', 'img', f)); nImg++;
  }
}

// ---- ícones, manifesto da app, robots, sitemap ----
const he = manifesto.marca.emblema.resumo;
copyFileSync(join(CACHE, `icone-${he}-32.png`), join(opcoes.saida, 'favicon.png'));
copyFileSync(join(CACHE, `icone-${he}-180.png`), join(opcoes.saida, 'apple-touch-icon.png'));
copyFileSync(join(CACHE, `icone-${he}-192.png`), join(opcoes.saida, 'icone-192.png'));
copyFileSync(join(CACHE, `icone-${he}-512.png`), join(opcoes.saida, 'icone-512.png'));
const asset = (c) => (opcoes.base + c).replace(/\/{2,}/g, '/');
writeFileSync(join(opcoes.saida, 'site.webmanifest'), JSON.stringify({
  name: site.marca, short_name: site.marcaCurta, start_url: asset('/'), display: 'browser',
  background_color: VARIANTES[site.variante].tema === 'escuro' ? '#0B0A08' : '#F6F1E9', theme_color: '#0B0A08',
  icons: [{ src: asset('/icone-192.png'), sizes: '192x192', type: 'image/png' }, { src: asset('/icone-512.png'), sizes: '512x512', type: 'image/png' }],
}, null, 1));
writeFileSync(join(opcoes.saida, '.nojekyll'), '');
if (opcoes.producao) {
  const indexaveis = todas.filter((p) => p.indexar !== false && !p.legal);
  writeFileSync(join(opcoes.saida, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${opcoes.url}/sitemap.xml\n`);
  writeFileSync(join(opcoes.saida, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexaveis.map((p) => `  <url><loc>${p.abs}</loc></url>`).join('\n')}\n</urlset>\n`);
} else {
  // pré-visualização: as páginas levam noindex; o robots deixa ler (para o Google ver o noindex)
  writeFileSync(join(opcoes.saida, 'robots.txt'), 'User-agent: *\nAllow: /\n');
}

console.log(`${nPaginas} páginas (${variantes.map((v) => v.toUpperCase()).join(', ')}), ${nImg} imagens, ${nVid} vídeos → ${opcoes.saida} (${opcoes.producao ? 'produção' : 'pré-visualização noindex'})`);
