#!/usr/bin/env node
// Prova o gerador com OUTRO conteúdo — o que o João pode fazer no painel —, numa cópia do site (o repositório não muda):
// a lavandaria e as recolhas abertas, a firma e o NIF, um horário com almoço e sábado, um telefone fixo sem WhatsApp,
// uma morada sem vírgula; espaços tirados, juntados e trocados de lugar, pares do antes e depois tirados, outras
// fotografias nos lugares fixos; e o que as regras tiram do site (um cartão sem nome, um par sem fotografia, um WhatsApp
// mal escrito). Cada variante constrói e passa o scripts/testar.mjs; a última (um telefone que não é número) tem de PARAR
// a publicação, com a anotação do ecrã.
//   node scripts/testar-variantes.mjs          (antes: python3 scripts/imagens.py, para haver .cache/imagens)
import { mkdtempSync, cpSync, symlinkSync, readFileSync, writeFileSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { serializar, gerarSlug } from '../src/lib/regras.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
if (!existsSync(join(RAIZ, '.cache', 'imagens', 'manifesto.json'))) { console.error('Falta .cache/imagens: corre primeiro python3 scripts/imagens.py'); process.exit(1); }

// um NIF que confere (o algarismo de controlo calculado)
const nifCom = (oito) => { const s = [...oito].reduce((a, d, i) => a + Number(d) * (9 - i), 0) % 11; return oito + (s < 2 ? 0 : 11 - s); };

const VARIANTES = [
  ['tudo aberto, firma e NIF, horário com almoço, telefone fixo sem WhatsApp', (site, serv) => {
    for (const d of serv.divisoes) d.estado = 'ativo';
    site.empresa = { firma: 'NEVOA Premium Services, Lda.', nif: nifCom('51234567') };
    site.horario = [{ de: 'Mo', ate: 'Fr', abre: '08:30', fecha: '13:00' }, { de: 'Mo', ate: 'Fr', abre: '14:00', fecha: '19:00' }, { de: 'Sa', ate: 'Sa', abre: '09:00', fecha: '13:00' }];
    site.telefone = '255 123 456';
    site.whatsapp = '';
    site.facebook = null;
    site.morada = { ...site.morada, rua: 'Avenida Dr. Leonardo Coimbra 120' };
    site.zona = { ...site.zona, titulo: 'No Norte inteiro', frase: 'Trabalhamos em todo o Norte, com a sede em Felgueiras.', curto: 'Todo o Norte', areas: ['Região Norte, Portugal'] };
    site.descricao = 'Limpezas profissionais, lavandaria e engomadoria em Felgueiras e em todo o Norte, com recolha e entrega ao domicílio.';
  }],
  ['a lavandaria aberta, e a descrição para o Google ainda a dizer «em breve» (o lembrete do painel)', (site, serv) => {
    serv.divisoes.find((d) => d.slug === 'laundry').estado = 'ativo';
  }],
  ['listas e fotografias mexidas', (site, serv) => {
    serv.espacos = serv.espacos.filter((e) => e.slug !== 'coworking');
    serv.espacos.splice(2, 0, { slug: gerarSlug('Escolas e creches', serv.espacos.map((e) => e.slug)), nome: 'Escolas e creches', icone: 'predio', linha: 'Salas, refeitórios e recreios limpos todos os dias.', empresas: true });
    serv.espacos.push({ slug: gerarSlug('Porque', serv.espacos.map((e) => e.slug)), nome: 'Porque', icone: 'casa', linha: 'Um espaço cujo endereço seria uma âncora da página.', empresas: false });
    serv.porque.reverse();
    /* Um cartão com o nome de outro da mesma lista (as regras deixam; o teste do site não se pode confundir). */
    serv.porque.push({ icone: 'torre', nome: serv.porque[0].nome, linha: 'Um segundo cartão com o mesmo nome do primeiro.' });
    serv.tiposLimpeza.push({ nome: 'Limpeza de estofos', linha: 'Sofás, cadeiras e colchões limpos a fundo.' });
    serv.roupa = serv.roupa.slice(0, 3);
    serv.antesDepois = serv.antesDepois.filter((p) => !['cozinha', 'duche'].includes(p.slug)).reverse();
    site.fotos = { fachada: 'loja-letreiro', letreiro: 'marca-limpeza', empresas: 'posobra-cozinha-depois' };
    const lav = serv.divisoes.find((d) => d.slug === 'laundry'); lav.foto = null; lav.icone = 'maquina';
    serv.divisoes.find((d) => d.slug === 'express').foto = 'loja-fachada';
  }],
  ['o que as regras tiram do site', (site, serv, fotos) => {
    serv.espacos[1].nome = '';
    serv.porque[0].icone = 'nao-existe';
    serv.antesDepois[0].depois = 'fotografia-que-nao-existe';
    serv.antesDepois[1].depois = serv.antesDepois[1].antes;
    site.whatsapp = '123';
    site.facebook = 'https://exemplo.pt/nevoa';
    serv.divisoes.find((d) => d.slug === 'express').foto = 'tambem-nao-existe';
    fotos['loja-letreiro'].foco = 140;
  }, { avisos: 7 }],
  ['um telefone que não é número PARA a publicação', (site) => { site.telefone = '12345'; }, { para: /::error title=Empresa::O telefone não é um número português/ }],
];

let falhas = 0;
for (const [nome, mudar, { para, avisos } = {}] of VARIANTES) {
  const pasta = mkdtempSync(join(tmpdir(), 'nevoa-variante-'));
  try {
    for (const d of ['content', 'src', 'scripts', 'legal-comum']) cpSync(join(RAIZ, d), join(pasta, d), { recursive: true });
    mkdirSync(join(pasta, 'media'));
    for (const d of ['fotos', 'videos', 'intro', 'marca']) symlinkSync(join(RAIZ, 'media', d), join(pasta, 'media', d));
    mkdirSync(join(pasta, '.cache'));
    symlinkSync(join(RAIZ, '.cache', 'imagens'), join(pasta, '.cache', 'imagens'));
    const ler = (f) => JSON.parse(readFileSync(join(pasta, f), 'utf8'));
    const site = ler('content/site.json'), serv = ler('content/servicos.json'), fotos = ler('content/fotos.json');
    mudar(site, serv, fotos);
    writeFileSync(join(pasta, 'content/site.json'), serializar(site));
    writeFileSync(join(pasta, 'content/servicos.json'), serializar(serv));
    writeFileSync(join(pasta, 'content/fotos.json'), serializar(fotos));
    const b = spawnSync(process.execPath, [join(pasta, 'scripts/build.mjs')], { cwd: pasta, encoding: 'utf8' });
    const saida = b.stdout + b.stderr;
    if (para) {
      const ok = b.status !== 0 && para.test(saida);
      console.log(`${ok ? '✓' : '✗'} ${nome}${ok ? '' : `\n${saida.slice(-1500)}`}`);
      if (!ok) falhas++;
      continue;
    }
    const t = b.status === 0 ? spawnSync(process.execPath, [join(pasta, 'scripts/testar.mjs')], { cwd: pasta, encoding: 'utf8' }) : null;
    const nAvisos = (saida.match(/::warning /g) || []).length;
    const ok = b.status === 0 && t.status === 0 && (avisos === undefined || nAvisos >= avisos);
    console.log(`${ok ? '✓' : '✗'} ${nome} (${(t?.stdout || '').trim().split('\n')[0] || 'não construiu'}; ${nAvisos} avisos)`);
    if (!ok) { falhas++; console.log((saida + (t ? t.stdout + t.stderr : '')).slice(-2500)); }
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
}
console.log(falhas ? `${falhas} variantes falharam.` : `As ${VARIANTES.length} variantes passaram.`);
process.exit(falhas ? 1 : 0);
