#!/usr/bin/env node
// Avisa o IndexNow (o Bing e a rede dele: Yandex, Seznam, Naver; o Google não entra, para ele vale o mapa do site no
// Search Console) das páginas novas ou mudadas, depois de publicar.
//
//   node scripts/indexnow.mjs --comparar --url=https://nevoagroup.pt
//       no CI, ANTES de publicar: compara o _site/sitemap.xml com o mapa que está no ar e escreve no GITHUB_OUTPUT
//       «urls=[…]», as páginas novas ou com data nova (a 1.ª vez, sem datas no ar, são todas)
//   URLS='[…]' node scripts/indexnow.mjs --enviar --url=https://nevoagroup.pt
//       no CI, DEPOIS de publicar: avisa dessas páginas (antes, o Bing viria buscar a versão antiga)
//   node scripts/indexnow.mjs --todas --url=https://nevoagroup.pt
//       à mão: avisa de todas as páginas do mapa que está no ar
//
// Nunca faz falhar a publicação: o site já está no ar, um aviso que falha é só um ::warning::. 200 ou 202 = aceite.
import { readFileSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHAVE = JSON.parse(readFileSync(join(RAIZ, 'content', 'site.json'), 'utf8')).verificacoes.indexnow;
const url = (process.argv.find((a) => a.startsWith('--url=')) || '--url=').slice(6).replace(/\/$/, '');
const aviso = (m) => console.log(`::warning::IndexNow: ${m}`);
const saida = (urls) => {
  console.log(`IndexNow: ${urls.length ? urls.join(' ') : 'nada mudou'}`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `urls=${JSON.stringify(urls)}\n`);
};
// o mapa do site → Map(endereço → data); «?_=» para não vir uma cópia antiga da cache do Pages
const datas = (xml) => new Map([...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?/g)].map((m) => [m[1], m[2] || '']));
const lerNoAr = (caminho) => fetch(`${url}${caminho}?_=${Date.now()}`, { headers: { 'user-agent': 'nevoa-indexnow' }, signal: AbortSignal.timeout(20000) });
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function avisar(urls) {
  if (!urls.length) return console.log('IndexNow: nada a avisar');
  // a chave tem de estar no ar (é lá que o Bing a confere); logo depois de publicar pode demorar uns segundos
  let chaveNoAr = false;
  for (let i = 0; i < 6 && !chaveNoAr; i++) {
    if (i) await esperar(10000);
    try { const r = await lerNoAr(`/${CHAVE}.txt`); chaveNoAr = r.ok && (await r.text()).trim() === CHAVE; } catch {}
  }
  if (!chaveNoAr) return aviso(`a chave não está em ${url}/${CHAVE}.txt: fica sem aviso desta vez`);
  const r = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: new URL(url).host, key: CHAVE, keyLocation: `${url}/${CHAVE}.txt`, urlList: urls }),
    signal: AbortSignal.timeout(30000),
  });
  console.log(`IndexNow: ${r.status} ${r.statusText}, ${urls.length} páginas`);
  if (![200, 202].includes(r.status)) aviso(`respondeu ${r.status} ${await r.text().catch(() => '')}`.trim());
}

try {
  if (!/^https:\/\/[a-z0-9.-]+$/.test(url)) throw new Error(`--url=${url}: falta o endereço do domínio`);
  if (process.argv.includes('--comparar')) {
    const novo = datas(readFileSync(join(RAIZ, '_site', 'sitemap.xml'), 'utf8'));
    const r = await lerNoAr('/sitemap.xml');
    // sem mapa no ar (404): o site é novo, são todas; outro erro: não se sabe o que mudou, não se avisa
    if (!r.ok && r.status !== 404) throw new Error(`o mapa no ar respondeu ${r.status}`);
    const noAr = r.ok ? datas(await r.text()) : new Map();
    saida([...novo].filter(([u, d]) => !d || noAr.get(u) !== d).map(([u]) => u));
  } else if (process.argv.includes('--enviar')) {
    await avisar(JSON.parse(process.env.URLS || '[]'));
  } else if (process.argv.includes('--todas')) {
    const r = await lerNoAr('/sitemap.xml');
    if (!r.ok) throw new Error(`o mapa no ar respondeu ${r.status}`);
    await avisar([...datas(await r.text()).keys()]);
  } else {
    throw new Error('falta --comparar, --enviar ou --todas');
  }
} catch (e) {
  aviso(e.message);
  if (process.argv.includes('--comparar')) saida([]);
}
