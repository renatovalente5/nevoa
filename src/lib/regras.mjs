/* AS REGRAS DOS DADOS DA NEVOA, NUM SÓ SÍTIO.
 *
 * Três leitores, e os três têm de ouvir o mesmo:
 *   · o gerador do site (scripts/build.mjs), antes de escrever as páginas;
 *   · o painel, no browser (o erro aparece por baixo do campo, antes de gravar);
 *   · o Worker do painel, ao gravar (recusa os problemas NOVOS que não sejam lembretes).
 * O painel usa uma CÓPIA BYTE A BYTE deste ficheiro (estatico/js/regras.js no repositório nevoa-painel), com um teste de
 * SHA-256 que falha se divergirem. Por isso é um ES module puro: nenhum import, nada de node:*, fs, process ou require.
 * Corre tal e qual no browser, num Worker e no Node. (A forma vem das regras da Encanto Real e da Franja Kids.)
 *
 * CADA PROBLEMA TEM UMA CLASSE:
 *   · bloqueia   — a publicação pára e o site fica como estava: a estrutura (um JSON que não se lê, uma lista que não é
 *                  lista) e o que todas as páginas usam (o telefone, o email, a morada, o horário, a zona, as divisões,
 *                  as fotografias fixas e a descrição de cada fotografia).
 *   · neutraliza — um cartão, um par do antes e depois, a fotografia ou o desenho de uma divisão, o WhatsApp ou o
 *                  Facebook, só na cópia que o gerador lê (o ficheiro não muda): o que está mal fica fora do site e o
 *                  resto publica-se.
 *   · avisa      — só aviso. No painel, os que não são lembrete são erro de campo (um NIF que não confere, um nome longo
 *                  de mais): o painel não os deixa gravar. Os LEMBRETES (lembrete: true) não são erro de ninguém: o
 *                  painel grava na mesma e mostra-os no Início («falta o NIF»).
 *
 * dados = { site, servicos, fotos: texto | objecto | null, ficheirosFotos?: [nome] }
 *   texto = o conteúdo do ficheiro; null = não existe. Uma chave de topo AUSENTE não se confere (o painel pode conferir
 *   só um documento); presente e null é «falta o ficheiro». ficheirosFotos: os nomes (sem .jpg) dos ficheiros em
 *   media/fotos/ (sem ela, uma fotografia «existe» se tiver descrição).
 *
 * problema = {
 *   classe:   'bloqueia' | 'neutraliza' | 'avisa',
 *   chave:    estável ('site:telefone', 'servicos:espacos.3:nome'…). O Worker compara as chaves do HEAD com as da
 *             gravação e recusa só as novas; por isso UMA CHAVE TEM SEMPRE A MESMA CLASSE.
 *   ficheiro: o caminho do ficheiro;
 *   ecra:     o ecrã do painel onde se corrige («Empresa», «Serviços», «Antes e depois», «Fotografias»);
 *   mensagem: para o dono, em português simples, sem caminhos de JSON;
 *   campo?:   o campo onde o painel mostra o erro ('telefone', 'horario.0.fecha', 'espacos.3.nome', 'loja-fachada.alt');
 *   efeito?:  só nos «neutraliza»: 'esconder' (com lista e indice) | 'sem_fotografia' | 'sem_icone' (com divisao) |
 *             'sem_whatsapp' | 'sem_facebook';
 *   lista?, indice?, divisao?, foto?, lembrete?
 * }
 *
 * «NÃO FOI DITO» E NULL SÃO O MESMO. E o vazio testa-se ANTES de converter.
 */

/* ------------------------------------------------------------------ */
/* Onde estão as coisas                                                */
/* ------------------------------------------------------------------ */

export const FICHEIROS = Object.freeze({
  site: 'content/site.json',
  servicos: 'content/servicos.json',
  fotos: 'content/fotos.json',
});
export const PASTAS = Object.freeze({ fotos: 'media/fotos' });
export const ficheiroDaFoto = (nome) => `${PASTAS.fotos}/${nome}.jpg`;

/* O que o painel não muda (o Worker responde 422 campo_bloqueado): a marca e o que vem dela, as verificações do Google e
   do Bing e a proposta escolhida. */
export const CAMPOS_FIXOS_SITE = Object.freeze(['marca', 'marcaCurta', 'titulo', 'lema', 'frase', 'desde', 'verificacoes', 'variante']);

/* As divisões são as do site, cada uma com a sua página: o painel não as cria, não as tira nem as troca de lugar; muda o
   estado, a área e a fotografia (ou o desenho) do cartão. O resto de cada divisão é fixo. */
export const DIVISOES = Object.freeze(['cleaning', 'laundry', 'express']);
export const CAMPOS_FIXOS_DIVISAO = Object.freeze(['slug', 'nome', 'curto', 'pagina', 'video', 'rotulo', 'foco']);
export const ESTADOS = Object.freeze({ ativo: 'Já disponível', 'em-breve': 'Em breve' });

/* As fotografias fixas do site (content/site.json → fotos), com o que lá vai. */
export const LUGARES_FOTOS = Object.freeze({
  fachada: 'A loja por fora',      // a casa, na página inicial; a lavandaria; a imagem do negócio para o Google
  letreiro: 'A loja por dentro',   // «A NEVOA»
  empresas: 'Para as empresas',    // «Como trabalhamos», nas Empresas
});

/* As listas de cartões (content/servicos.json), pela ordem das páginas. */
export const LISTAS = Object.freeze({
  espacos: Object.freeze({ nome: 'Onde atuamos', icone: true, espaco: true, maximo: 24 }),
  tiposLimpeza: Object.freeze({ nome: 'Os serviços de limpeza', maximo: 16 }),
  porque: Object.freeze({ nome: 'Porquê a NEVOA', icone: true, maximo: 12 }),
  passosEmpresas: Object.freeze({ nome: 'Como trabalhamos com as empresas', maximo: 8 }),
  roupa: Object.freeze({ nome: 'O que a lavandaria trata', icone: true, maximo: 16 }),
  passosLavandaria: Object.freeze({ nome: 'Como funciona a lavandaria', maximo: 8 }),
  passosExpress: Object.freeze({ nome: 'Como funcionam as recolhas', maximo: 8 }),
  pilares: Object.freeze({ nome: 'O compromisso da NEVOA', icone: true, maximo: 8 }),
});

/* Os desenhos que um cartão pode ter: os nomes de src/lib/icones.mjs → ICONES_DOS_CARTOES (as provas conferem que
   batem; aqui não há imports). */
export const NOMES_DOS_ICONES = Object.freeze(['casa', 'predio', 'escritorio', 'torre', 'coworking', 'fabrica', 'loja', 'cruz', 'haltere', 'hotel', 'chave', 'taca', 'capacete', 'frasco', 'pessoas', 'plano', 'relogio', 'lupa', 'escudo', 'estrela', 'orcamento', 'local', 'camisa', 'cama', 'edredao', 'farda', 'ferro', 'cortina', 'texteis', 'sapato', 'maquina', 'carrinha']);

/* As âncoras das páginas que um espaço novo não pode ter (o endereço de um espaço é a âncora do cartão dele:
   /limpeza/#casas), e os começos das outras. */
export const ANCORAS_RESERVADAS = Object.freeze(['antes-e-depois', 'como-funciona', 'como-trabalhamos', 'compromisso', 'conteudo', 'divisoes', 'espacos', 'menu', 'o-que-tratamos', 'pedido', 'porque', 'pos-obra', 'recolha', 'servicos', 'tipos', 'zona', 'topo', 'intro', 'casa']);
const RE_ANCORA_RESERVADA = /^(t|ad|adl|adc|pedido)-/;

export const TAMANHOS = Object.freeze({
  nome: 50, linha: 140, compromisso: 300, area: 60, descricao: 160, rua: 120, localidade: 60, distrito: 40,
  firma: 120, email: 120, url: 400, instagram: 30, zonaTitulo: 60, zonaFrase: 220, zonaCurto: 40, regiao: 60,
  alt: 200, altMinimo: 12, nomeFoto: 80, nomePar: 30,
});
export const MAXIMOS = Object.freeze({ horario: 6, regioes: 8, pares: 16 });

/* ------------------------------------------------------------------ */
/* Ajudas                                                              */
/* ------------------------------------------------------------------ */

export const eObjecto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
export const vazio = (v) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
export const numero = (v) => typeof v === 'number' && Number.isFinite(v);
export const dentro = (v, [a, b]) => numero(v) && v >= a && v <= b;
export const inteiro = (v, lim) => Number.isInteger(v) && dentro(v, lim);
export const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const copia = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

export const terminacaoDe = (t) => (typeof t === 'string' && t.endsWith('\n') ? '\n' : '');
export function serializar(obj, terminacao = '\n') { return JSON.stringify(obj, null, 2) + (terminacao || ''); }

/** Lê um documento: texto (o ficheiro), objecto (já lido) ou null (não existe). */
export function lerDocumento(v) {
  if (v === null || v === undefined) return { valor: null, erro: 'falta' };
  if (typeof v !== 'string') return { valor: v, erro: null };
  try { return { valor: JSON.parse(v), erro: null }; } catch (e) { return { valor: null, erro: 'json' }; }
}

/** Mesmo valor (para saber se um campo fixo mudou): JSON canónico. */
export function mesmoValor(a, b) {
  const canon = (v) => (Array.isArray(v) ? v.map(canon) : eObjecto(v) ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])])) : v ?? null);
  return JSON.stringify(canon(a)) === JSON.stringify(canon(b));
}

export const RE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const slugValido = (s) => typeof s === 'string' && s.length <= 60 && RE_SLUG.test(s);
export const nomeDeFotoValido = (n) => typeof n === 'string' && n.length <= TAMANHOS.nomeFoto && RE_SLUG.test(n);
export const ancoraReservada = (s) => ANCORAS_RESERVADAS.includes(s) || RE_ANCORA_RESERVADA.test(String(s ?? ''));

/** O endereço de um cartão ou de um par novo, a partir do nome, sem repetir os que já há (nem as âncoras das páginas). */
export function gerarSlug(nome, existentes = [], vazio_ = 'cartao') {
  const base = String(nome ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50).replace(/-+$/g, '') || vazio_;
  const usados = new Set(existentes);
  const livre = (s) => !usados.has(s) && !ancoraReservada(s);
  if (livre(base)) return base;
  for (let i = 2; ; i++) if (livre(`${base}-${i}`)) return `${base}-${i}`;
}

export function nifValido(nif) {
  const n = String(nif ?? '').replace(/\s/g, '');
  if (!/^[1235689]\d{8}$/.test(n) && !/^(45|70|71|72|74|75|77|79|90|91|98|99)\d{7}$/.test(n)) return false;
  const soma = [...n.slice(0, 8)].reduce((s, d, i) => s + Number(d) * (9 - i), 0);
  const resto = soma % 11;
  const controlo = resto < 2 ? 0 : 11 - resto;
  return controlo === Number(n[8]);
}

export const RE_EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
export const emailValido = (v) => typeof v === 'string' && v.length <= TAMANHOS.email && RE_EMAIL.test(v.trim());

/** Um número português em 9 algarismos (sem +351, espaços nem pontos), ou null. */
export function numeroPortugues(v) {
  const d = String(v ?? '').replace(/[\s.()-]/g, '').replace(/^(\+|00)351/, '');
  return /^[29]\d{8}$/.test(d) ? d : null;
}
export const eTelemovel = (v) => /^9[1236]\d{7}$/.test(numeroPortugues(v) ?? '');
/** O telefone como o site o escreve: «910 079 994». */
export const telefoneFormatado = (v) => { const d = numeroPortugues(v); return d ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : ''; };
/** O WhatsApp como o wa.me o quer: o indicativo e o número, só algarismos («351912345678»). */
export function numeroWhatsApp(v) {
  const s = String(v ?? '').replace(/[\s.()-]/g, '').replace(/^(\+|00)/, '');
  if (/^9[1236]\d{7}$/.test(s)) return '351' + s;
  return /^[1-9]\d{7,14}$/.test(s) ? s : null;
}
/** O nome do Instagram, do que se escrever: «@nevoaservices», o endereço do perfil ou o nome. */
export function nomeInstagram(v) {
  const t = texto(v).replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/[/?#].*$/, '');
  return /^[A-Za-z0-9._]{1,30}$/.test(t) ? t : null;
}
export const codigoPostalValido = (v) => /^\d{4}-\d{3}$/.test(texto(v));
export const urlValido = (v, dominio) => {
  const t = texto(v);
  if (!/^https:\/\/[^\s]+$/.test(t) || t.length > TAMANHOS.url) return false;
  if (!dominio) return true;
  try { const h = new URL(t).hostname.replace(/^www\./, ''); return h === dominio || h.endsWith('.' + dominio); } catch { return false; }
};
/** Uma ligação do Google Maps (a do «Partilhar» da aplicação ou a do browser). */
export function mapaValido(v) {
  if (!urlValido(v)) return false;
  try {
    const u = new URL(texto(v));
    const h = u.hostname.replace(/^www\./, '');
    if (h === 'maps.app.goo.gl' || h === 'goo.gl' || h === 'maps.google.com' || h === 'maps.google.pt') return true;
    return (h === 'google.com' || h === 'google.pt') && u.pathname.startsWith('/maps');
  } catch { return false; }
}

/* ------------------------------------------------------------------ */
/* O horário                                                           */
/* ------------------------------------------------------------------ */

/* Uma linha do horário: { de, ate, abre, fecha } — os dias de «de» a «ate» (o mesmo, num dia só), das «abre» às
   «fecha». Várias linhas com os mesmos dias juntam-se («das 9h às 13h e das 14h às 19h»). */
export const DIAS = Object.freeze(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']);
export const NOMES_DOS_DIAS = Object.freeze({ Mo: 'segunda', Tu: 'terça', We: 'quarta', Th: 'quinta', Fr: 'sexta', Sa: 'sábado', Su: 'domingo' });
const CURTOS_DOS_DIAS = Object.freeze({ Mo: 'seg.', Tu: 'ter.', We: 'qua.', Th: 'qui.', Fr: 'sex.', Sa: 'sáb.', Su: 'dom.' });
export const RE_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
export const horaValida = (h) => typeof h === 'string' && RE_HORA.test(h);
const diasDe = (l) => { const a = DIAS.indexOf(l.de), b = DIAS.indexOf(l.ate || l.de); return DIAS.slice(a, b + 1); };

/** O que está mal numa linha do horário ({ campo, mensagem }), ou null. As outras linhas servem para ver se se cruzam. */
export function problemaDaLinha(l, linhas = [], i = -1) {
  if (!eObjecto(l)) return { campo: 'de', mensagem: 'Esta linha do horário não se lê.' };
  if (!DIAS.includes(l.de)) return { campo: 'de', mensagem: 'Escolha o primeiro dia.' };
  if (!vazio(l.ate) && (!DIAS.includes(l.ate) || DIAS.indexOf(l.ate) < DIAS.indexOf(l.de))) return { campo: 'ate', mensagem: 'O último dia tem de vir depois do primeiro.' };
  if (!horaValida(l.abre)) return { campo: 'abre', mensagem: 'Escreva a hora a que abre (8:00).' };
  if (!horaValida(l.fecha)) return { campo: 'fecha', mensagem: 'Escreva a hora a que fecha (20:00).' };
  if (l.fecha <= l.abre) return { campo: 'fecha', mensagem: 'Fecha antes de abrir.' };
  const meus = diasDe(l);
  for (let j = 0; j < i; j++) {
    const o = linhas[j];
    if (!eObjecto(o) || !DIAS.includes(o.de) || !horaValida(o.abre) || !horaValida(o.fecha)) continue;
    if (diasDe(o).some((d) => meus.includes(d)) && l.abre < o.fecha && o.abre < l.fecha) return { campo: 'abre', mensagem: 'Este horário cruza-se com o de cima.' };
  }
  return null;
}

const horaTexto = (h) => { const [H, M] = h.split(':'); return `${Number(H)}h${M === '00' ? '' : M}`; };
const das = (h) => (Number(h.split(':')[0]) === 1 ? `da ${horaTexto(h)}` : `das ${horaTexto(h)}`);
const as = (h) => (Number(h.split(':')[0]) === 1 ? `à ${horaTexto(h)}` : `às ${horaTexto(h)}`);
const maiuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);

/** O horário como o site o escreve: o texto («Segunda a sábado, das 8h às 20h»), o curto («Seg. a sáb., 8h–20h») e o do
    Google («Mo-Sa 08:00-20:00»). */
export function horarioTextos(linhas) {
  const grupos = [];
  for (const l of linhas) {
    const ate = vazio(l.ate) ? l.de : l.ate;
    let g = grupos.find((x) => x.de === l.de && x.ate === ate);
    if (!g) grupos.push((g = { de: l.de, ate, intervalos: [] }));
    g.intervalos.push([l.abre, l.fecha]);
  }
  for (const g of grupos) g.intervalos.sort((a, b) => a[0].localeCompare(b[0]));
  grupos.sort((a, b) => DIAS.indexOf(a.de) - DIAS.indexOf(b.de) || DIAS.indexOf(a.ate) - DIAS.indexOf(b.ate));
  const dias = (g, nomes) => (g.de === g.ate ? nomes[g.de] : `${nomes[g.de]} a ${nomes[g.ate]}`);
  return {
    texto: maiuscula(grupos.map((g) => `${dias(g, NOMES_DOS_DIAS)}, ${g.intervalos.map(([a, f]) => `${das(a)} ${as(f)}`).join(' e ')}`).join('; ')),
    curto: grupos.map((g) => maiuscula(`${dias(g, CURTOS_DOS_DIAS)}, ${g.intervalos.map(([a, f]) => `${horaTexto(a)}–${horaTexto(f)}`).join(' e ')}`)).join(' · '),
    schema: grupos.flatMap((g) => g.intervalos.map(([a, f]) => `${g.de === g.ate ? g.de : `${g.de}-${g.ate}`} ${a}-${f}`)).join(', '),
  };
}

/* ------------------------------------------------------------------ */
/* As regras                                                           */
/* ------------------------------------------------------------------ */

const ECRAS = Object.freeze({ site: 'Empresa', servicos: 'Serviços', fotos: 'Fotografias' });

/** Confere os dados (ver o cabeçalho) e devolve a lista de problemas. */
export function validar(dados) {
  const P = [];
  const add = (p) => P.push(p);
  const lidos = {};
  for (const k of Object.keys(FICHEIROS)) {
    if (!(k in dados)) continue;
    const { valor, erro } = lerDocumento(dados[k]);
    const base = { classe: 'bloqueia', ficheiro: FICHEIROS[k], ecra: ECRAS[k] };
    if (erro === 'json') add({ ...base, chave: `${k}:json`, mensagem: `O ficheiro ${FICHEIROS[k]} não se lê (não é JSON).` });
    else if (erro === 'falta') add({ ...base, chave: `${k}:falta`, mensagem: `Falta o ficheiro ${FICHEIROS[k]}.` });
    else if (!eObjecto(valor)) add({ ...base, chave: `${k}:forma`, mensagem: `O ficheiro ${FICHEIROS[k]} não tem a forma certa.` });
    lidos[k] = eObjecto(valor) ? valor : null;
  }
  const indice = 'fotos' in dados ? lidos.fotos : undefined;   // undefined: não se sabe (não se confere)
  const ficheiros = Array.isArray(dados.ficheirosFotos) ? new Set(dados.ficheirosFotos) : null;
  const fotoExiste = (n) => nomeDeFotoValido(n) && (indice === undefined || (indice !== null && Object.hasOwn(indice, n))) && (!ficheiros || ficheiros.has(n));
  if (lidos.site) regrasSite(lidos.site, { add, fotoExiste, servicos: lidos.servicos });
  if (lidos.servicos) regrasServicos(lidos.servicos, { add, fotoExiste });
  if (lidos.fotos) regrasFotos(lidos.fotos, { add, ficheiros });
  return P;
}

function regrasSite(s, { add, fotoExiste, servicos }) {
  const P = (classe, chave, mensagem, extra = {}) => add({ classe, chave: `site:${chave}`, ficheiro: FICHEIROS.site, ecra: 'Empresa', mensagem, ...extra });
  for (const c of ['marca', 'marcaCurta', 'titulo', 'lema']) if (vazio(s[c])) P('bloqueia', c, `Falta «${c}» no ficheiro do site.`);

  const d = texto(s.descricao);
  if (!d) P('bloqueia', 'descricao', 'Escreva a descrição do site para o Google.', { campo: 'descricao' });
  else if (d.length > TAMANHOS.descricao) P('avisa', 'descricao:longa', `A descrição tem ${d.length} letras: o Google mostra até ${TAMANHOS.descricao}.`, { campo: 'descricao' });
  else if (/em breve/i.test(d) && eObjecto(servicos) && Array.isArray(servicos.divisoes) && servicos.divisoes.some((x) => x?.slug === 'laundry' && x.estado === 'ativo')) {
    P('avisa', 'descricao:em-breve', 'A descrição para o Google ainda diz «em breve», e a lavandaria já está aberta.', { campo: 'descricao', lembrete: true });
  }

  if (!numeroPortugues(s.telefone)) P('bloqueia', 'telefone', vazio(s.telefone) ? 'Escreva o telefone.' : 'O telefone não é um número português de 9 algarismos.', { campo: 'telefone' });
  if (!vazio(s.whatsapp) && !numeroWhatsApp(s.whatsapp)) P('neutraliza', 'whatsapp', 'O número do WhatsApp não é válido: os botões do WhatsApp ficam fora do site.', { campo: 'whatsapp', efeito: 'sem_whatsapp' });
  if (!emailValido(s.email)) P('bloqueia', 'email', vazio(s.email) ? 'Escreva o email.' : 'O email não está bem escrito.', { campo: 'email' });
  if (!/^[A-Za-z0-9._]{1,30}$/.test(texto(s.instagram))) P('bloqueia', 'instagram', vazio(s.instagram) ? 'Escreva o nome do Instagram.' : 'O nome do Instagram só leva letras, algarismos, pontos e traços baixos.', { campo: 'instagram' });
  if (!vazio(s.facebook) && !urlValido(s.facebook, 'facebook.com')) P('neutraliza', 'facebook', 'O endereço do Facebook não é de uma página do Facebook: fica fora do site.', { campo: 'facebook', efeito: 'sem_facebook' });

  const m = eObjecto(s.morada) ? s.morada : {};
  if (vazio(m.rua)) P('bloqueia', 'morada.rua', 'Escreva a rua e o número da loja.', { campo: 'morada.rua' });
  else if (texto(m.rua).length > TAMANHOS.rua) P('avisa', 'morada.rua:longa', `A rua tem ${texto(m.rua).length} letras: o máximo é ${TAMANHOS.rua}.`, { campo: 'morada.rua' });
  if (!codigoPostalValido(m.codigoPostal)) P('bloqueia', 'morada.codigoPostal', vazio(m.codigoPostal) ? 'Escreva o código postal.' : 'O código postal escreve-se assim: 4610-282.', { campo: 'morada.codigoPostal' });
  if (vazio(m.localidade)) P('bloqueia', 'morada.localidade', 'Escreva a localidade.', { campo: 'morada.localidade' });
  else if (texto(m.localidade).length > TAMANHOS.localidade) P('avisa', 'morada.localidade:longa', `A localidade tem ${texto(m.localidade).length} letras: o máximo é ${TAMANHOS.localidade}.`, { campo: 'morada.localidade' });
  if (vazio(m.distrito)) P('bloqueia', 'morada.distrito', 'Escreva o distrito.', { campo: 'morada.distrito' });
  else if (texto(m.distrito).length > TAMANHOS.distrito) P('avisa', 'morada.distrito:longo', `O distrito tem ${texto(m.distrito).length} letras: o máximo é ${TAMANHOS.distrito}.`, { campo: 'morada.distrito' });
  if (!mapaValido(s.mapa)) P('bloqueia', 'mapa', vazio(s.mapa) ? 'Falta a ligação do Google Maps («Como chegar»).' : 'A ligação do mapa tem de ser do Google Maps.', { campo: 'mapa' });

  if (!Array.isArray(s.horario) || !s.horario.length) P('bloqueia', 'horario', 'Escreva o horário.', { campo: 'horario' });
  else {
    if (s.horario.length > MAXIMOS.horario) P('avisa', 'horario:muitas', `O horário tem ${s.horario.length} linhas: o máximo é ${MAXIMOS.horario}.`, { campo: 'horario' });
    s.horario.forEach((l, i) => { const e = problemaDaLinha(l, s.horario, i); if (e) P('bloqueia', `horario.${i}`, e.mensagem, { campo: `horario.${i}.${e.campo}` }); });
  }

  const z = eObjecto(s.zona) ? s.zona : {};
  for (const [c, max, falta] of [['titulo', TAMANHOS.zonaTitulo, 'o título da zona'], ['frase', TAMANHOS.zonaFrase, 'a frase da zona'], ['curto', TAMANHOS.zonaCurto, 'a zona em poucas palavras']]) {
    if (vazio(z[c])) P('bloqueia', `zona.${c}`, `Escreva ${falta}.`, { campo: `zona.${c}` });
    else if (texto(z[c]).length > max) P('avisa', `zona.${c}:longo`, `Tem ${texto(z[c]).length} letras: o máximo é ${max}.`, { campo: `zona.${c}` });
  }
  if (!Array.isArray(z.areas) || !z.areas.some((a) => !vazio(a))) P('bloqueia', 'zona.areas', 'Escreva pelo menos uma região onde trabalham.', { campo: 'zona.areas' });
  else {
    if (z.areas.length > MAXIMOS.regioes) P('avisa', 'zona.areas:muitas', `São ${z.areas.length} regiões: o máximo é ${MAXIMOS.regioes}.`, { campo: 'zona.areas' });
    z.areas.forEach((a, i) => {
      if (vazio(a)) P('avisa', `zona.areas.${i}`, 'Escreva a região, ou tire a linha.', { campo: `zona.areas.${i}` });
      else if (texto(a).length > TAMANHOS.regiao) P('avisa', `zona.areas.${i}:longa`, `Tem ${texto(a).length} letras: o máximo é ${TAMANHOS.regiao}.`, { campo: `zona.areas.${i}` });
    });
  }

  // a firma e o NIF: pela PRESENÇA (um NIF à espera do verdadeiro não tranca a publicação); a meio, o site diz «por confirmar»
  const e = eObjecto(s.empresa) ? s.empresa : {};
  const firma = texto(e.firma), nif = String(e.nif ?? '').replace(/\s/g, '');
  if (!firma && !nif) P('avisa', 'empresa', 'Falta o nome da empresa e o NIF: os Contactos e a Privacidade dizem «por confirmar».', { campo: 'empresa.firma', lembrete: true });
  else {
    if (!firma) P('avisa', 'empresa.firma', 'Escreva também o nome da empresa, como está nas Finanças.', { campo: 'empresa.firma' });
    else if (firma.length > TAMANHOS.firma) P('avisa', 'empresa.firma:longa', `O nome tem ${firma.length} letras: o máximo é ${TAMANHOS.firma}.`, { campo: 'empresa.firma' });
    if (!nif) P('avisa', 'empresa.nif', 'Escreva também o NIF.', { campo: 'empresa.nif' });
    else if (!nifValido(nif)) P('avisa', 'empresa.nif:invalido', 'Este NIF não confere: veja os algarismos.', { campo: 'empresa.nif' });
  }

  const f = eObjecto(s.fotos) ? s.fotos : {};
  for (const [lugar, nome] of Object.entries(LUGARES_FOTOS)) {
    if (!fotoExiste(f[lugar])) P('bloqueia', `fotos.${lugar}`, `Falta a fotografia de «${nome}».`, { ecra: 'Fotografias', campo: `fotos.${lugar}` });
  }
}

function regrasServicos(c, { add, fotoExiste }) {
  const P = (classe, chave, mensagem, extra = {}) => add({ classe, chave: `servicos:${chave}`, ficheiro: FICHEIROS.servicos, ecra: 'Serviços', mensagem, ...extra });

  if (!Array.isArray(c.divisoes)) P('bloqueia', 'divisoes', 'Faltam as divisões.');
  else {
    for (const slug of DIVISOES) if (!c.divisoes.some((d) => d?.slug === slug)) P('bloqueia', `divisao:${slug}`, `Falta a divisão «${slug}».`);
    c.divisoes.forEach((d, i) => {
      if (!eObjecto(d)) return P('bloqueia', `divisoes.${i}`, 'Uma das divisões não se lê.');
      const nome = texto(d.nome) || String(d.slug);
      if (vazio(d.nome) || vazio(d.curto) || !/^\/[a-z-]+\/$/.test(d.pagina || '')) P('bloqueia', `divisao:${d.slug}:forma`, `A divisão «${nome}» não tem o nome, o nome curto ou a página.`);
      if (vazio(d.area)) P('bloqueia', `divisao:${d.slug}:area`, `Escreva o que faz a ${nome}.`, { campo: `divisoes.${i}.area` });
      else if (texto(d.area).length > TAMANHOS.area) P('avisa', `divisao:${d.slug}:area-longa`, `Tem ${texto(d.area).length} letras: o máximo é ${TAMANHOS.area}.`, { campo: `divisoes.${i}.area` });
      if (!Object.hasOwn(ESTADOS, d.estado)) P('bloqueia', `divisao:${d.slug}:estado`, `Escolha se a ${nome} já está disponível.`, { campo: `divisoes.${i}.estado` });
      const fotoBoa = !vazio(d.foto) && fotoExiste(d.foto);
      const iconeBom = NOMES_DOS_ICONES.includes(d.icone);
      if (!vazio(d.foto) && !fotoBoa) P('neutraliza', `divisao:${d.slug}:foto`, `A fotografia da ${nome} não existe: o cartão fica com o desenho.`, { campo: `divisoes.${i}.foto`, efeito: 'sem_fotografia', divisao: d.slug });
      if (!vazio(d.icone) && !iconeBom) P('neutraliza', `divisao:${d.slug}:icone`, `O desenho da ${nome} não existe.`, { campo: `divisoes.${i}.icone`, efeito: 'sem_icone', divisao: d.slug });
      if (vazio(d.video) && !fotoBoa && !iconeBom) P('bloqueia', `divisao:${d.slug}:cartao`, `A ${nome} precisa de uma fotografia ou de um desenho para o cartão.`, { campo: `divisoes.${i}.foto` });
    });
  }

  for (const [lista, def] of Object.entries(LISTAS)) {
    const l = c[lista];
    if (!Array.isArray(l)) { P('bloqueia', lista, `Falta a lista «${def.nome}».`); continue; }
    if (!l.length) P('bloqueia', `${lista}:vazia`, `«${def.nome}» precisa de pelo menos um cartão.`, { campo: lista });
    if (l.length > def.maximo) P('avisa', `${lista}:muitos`, `«${def.nome}» tem ${l.length} cartões: o máximo é ${def.maximo}.`, { campo: lista });
    const slugs = new Set();
    l.forEach((item, i) => {
      const fora = (regra, mensagem, campo) => P('neutraliza', `${lista}.${i}:${regra}`, mensagem, { efeito: 'esconder', lista, indice: i, ...(campo ? { campo: `${lista}.${i}.${campo}` } : {}) });
      if (!eObjecto(item)) return fora('forma', `Um cartão de «${def.nome}» não se lê: fica fora do site.`);
      const nome = texto(item.nome);
      const quem = nome ? `«${nome}»` : `O ${i + 1}.º cartão de «${def.nome}»`;
      if (!nome) fora('nome', `${quem} não tem nome: fica fora do site.`, 'nome');
      else if (nome.length > TAMANHOS.nome) P('avisa', `${lista}.${i}:nome-longo`, `O nome tem ${nome.length} letras: o máximo é ${TAMANHOS.nome}.`, { campo: `${lista}.${i}.nome` });
      const linha = texto(item.linha);
      if (!linha) fora('linha', `${quem} não tem a frase: fica fora do site.`, 'linha');
      else if (linha.length > TAMANHOS.linha) P('avisa', `${lista}.${i}:linha-longa`, `A frase tem ${linha.length} letras: o máximo é ${TAMANHOS.linha}.`, { campo: `${lista}.${i}.linha` });
      if (def.icone && !NOMES_DOS_ICONES.includes(item.icone)) fora('icone', `${quem} não tem desenho: fica fora do site.`, 'icone');
      if (def.espaco) {
        if (typeof item.empresas !== 'boolean') fora('empresas', `${quem} não diz se aparece nas Empresas: fica fora do site.`, 'empresas');
        if (!slugValido(item.slug) || ancoraReservada(item.slug)) fora('slug', `${quem} não tem um endereço válido: fica fora do site.`);
        else if (slugs.has(item.slug)) fora('slug-repetido', `${quem} repete o endereço de outro espaço: fica fora do site.`);
        else slugs.add(item.slug);
      }
    });
  }

  if (!vazio(c.compromisso) && texto(c.compromisso).length > TAMANHOS.compromisso) P('avisa', 'compromisso:longo', `Tem ${texto(c.compromisso).length} letras: o máximo é ${TAMANHOS.compromisso}.`, { campo: 'compromisso' });

  if (!Array.isArray(c.antesDepois)) P('bloqueia', 'antesDepois', 'Falta a lista do antes e depois.', { ecra: 'Antes e depois' });
  else {
    if (c.antesDepois.length > MAXIMOS.pares) P('avisa', 'antesDepois:muitos', `São ${c.antesDepois.length} pares: o máximo é ${MAXIMOS.pares}.`, { ecra: 'Antes e depois', campo: 'antesDepois' });
    const slugs = new Set();
    c.antesDepois.forEach((p, i) => {
      const fora = (regra, mensagem, campo) => P('neutraliza', `antesDepois.${i}:${regra}`, mensagem, { ecra: 'Antes e depois', efeito: 'esconder', lista: 'antesDepois', indice: i, ...(campo ? { campo: `antesDepois.${i}.${campo}` } : {}) });
      if (!eObjecto(p)) return fora('forma', 'Um par do antes e depois não se lê: fica fora do site.');
      const nome = texto(p.nome);
      const quem = nome ? `«${nome}»` : `O ${i + 1}.º par`;
      if (!nome) fora('nome', `${quem} não tem nome: fica fora do site.`, 'nome');
      else if (nome.length > TAMANHOS.nomePar) P('avisa', `antesDepois.${i}:nome-longo`, `O nome tem ${nome.length} letras: o máximo é ${TAMANHOS.nomePar}.`, { ecra: 'Antes e depois', campo: `antesDepois.${i}.nome` });
      if (!slugValido(p.slug)) fora('slug', `${quem} não tem um endereço válido: fica fora do site.`);
      else if (slugs.has(p.slug)) fora('slug-repetido', `${quem} repete o endereço de outro par: fica fora do site.`);
      else slugs.add(p.slug);
      for (const lado of ['antes', 'depois']) if (!fotoExiste(p[lado])) fora(lado, `Falta a fotografia do ${lado} de ${quem}: fica fora do site.`, lado);
      if (!vazio(p.antes) && p.antes === p.depois) fora('iguais', `O antes e o depois de ${quem} são a mesma fotografia: fica fora do site.`, 'depois');
    });
  }
}

function regrasFotos(f, { add, ficheiros }) {
  const P = (classe, chave, mensagem, extra = {}) => add({ classe, chave: `foto:${chave}`, ficheiro: FICHEIROS.fotos, ecra: 'Fotografias', mensagem, ...extra });
  for (const [nome, v] of Object.entries(f)) {
    if (!nomeDeFotoValido(nome)) { P('bloqueia', `${nome}:nome`, `O nome da fotografia «${nome}» não é válido.`, { foto: nome }); continue; }
    if (!eObjecto(v)) { P('bloqueia', `${nome}:forma`, `A descrição da fotografia «${nome}» não se lê.`, { foto: nome }); continue; }
    const alt = texto(v.alt);
    if (alt.length < TAMANHOS.altMinimo) P('bloqueia', `${nome}:alt`, alt ? 'A descrição é curta de mais: diga o que se vê na fotografia.' : 'Descreva o que se vê na fotografia (é o que ouve quem não a vê).', { campo: `${nome}.alt`, foto: nome });
    else if (alt.length > TAMANHOS.alt) P('avisa', `${nome}:alt-longa`, `A descrição tem ${alt.length} letras: o máximo é ${TAMANHOS.alt}.`, { campo: `${nome}.alt`, foto: nome });
    if (v.foco !== undefined && !inteiro(v.foco, [0, 100])) P('avisa', `${nome}:foco`, 'O ponto de foco vai de 0 (em cima) a 100 (em baixo).', { campo: `${nome}.foco`, foto: nome });
    if (ficheiros && !ficheiros.has(nome)) P('bloqueia', `${nome}:ficheiro`, `A fotografia «${nome}» tem descrição mas não está na biblioteca.`, { foto: nome });
  }
  if (ficheiros) for (const nome of ficheiros) if (!Object.hasOwn(f, nome)) P('bloqueia', `${nome}:sem-descricao`, `A fotografia «${nome}» não tem descrição.`, { foto: nome });
}

/* ------------------------------------------------------------------ */
/* O que o gerador faz com os problemas                                */
/* ------------------------------------------------------------------ */

export const bloqueios = (problemas) => problemas.filter((p) => p.classe === 'bloqueia');
export const lembretes = (problemas) => problemas.filter((p) => p.lembrete);

/** O que fica fora do site: os cartões e os pares por lista (índices), as fotografias e os desenhos das divisões, o
    WhatsApp e o Facebook. */
export function neutralizar(problemas) {
  const listas = {};
  const semFoto = new Set(), semIcone = new Set();
  let semWhatsapp = false, semFacebook = false;
  for (const p of problemas) {
    if (p.classe !== 'neutraliza') continue;
    if (p.efeito === 'esconder' && p.lista) (listas[p.lista] ??= new Set()).add(p.indice);
    else if (p.efeito === 'sem_fotografia') semFoto.add(p.divisao);
    else if (p.efeito === 'sem_icone') semIcone.add(p.divisao);
    else if (p.efeito === 'sem_whatsapp') semWhatsapp = true;
    else if (p.efeito === 'sem_facebook') semFacebook = true;
  }
  return { listas, semFoto, semIcone, semWhatsapp, semFacebook };
}

/** O conteúdo como as páginas o usam (cópias; os ficheiros não mudam): sem o que fica fora, com o horário por extenso
    ({ texto, curto, schema }), o telefone «910 079 994», o WhatsApp só em algarismos, e a firma e o NIF só os dois
    juntos (a meio, o site diz «por confirmar»). */
export function paraOSite(site, servicos, problemas) {
  const n = neutralizar(problemas);
  const s = copia(site);
  s.horario = horarioTextos(site.horario);
  s.telefone = telefoneFormatado(site.telefone);
  s.whatsapp = n.semWhatsapp || vazio(site.whatsapp) ? '' : numeroWhatsApp(site.whatsapp);
  s.facebook = n.semFacebook || vazio(site.facebook) ? null : texto(site.facebook);
  const firma = texto(site.empresa?.firma), nif = String(site.empresa?.nif ?? '').replace(/\s/g, '');
  s.empresa = firma && nif ? { firma, nif } : { firma: null, nif: null };
  const c = copia(servicos);
  for (const lista of [...Object.keys(LISTAS), 'antesDepois']) {
    const fora = n.listas[lista];
    if (fora && Array.isArray(c[lista])) c[lista] = c[lista].filter((_, i) => !fora.has(i));
  }
  c.divisoes = c.divisoes.map((d) => ({ ...d, foto: n.semFoto.has(d.slug) || vazio(d.foto) ? null : d.foto, icone: n.semIcone.has(d.slug) || vazio(d.icone) ? null : d.icone }));
  return { site: s, servicos: c };
}
