/* OS ÍCONES DO SITE DA NEVOA, NUM SÓ SÍTIO.
 *
 * Desenhos de traço (24×24, traço 1,5), no desenho dos ícones dourados das publicações da NEVOA. O gerador usa-os
 * (src/templates/util.mjs → icone) e o painel mostra-os para escolher o desenho de cada cartão: o painel usa uma CÓPIA
 * BYTE A BYTE deste ficheiro (estatico/js/icones.js no repositório nevoa-painel), com um teste de SHA-256 que falha se
 * divergirem. Por isso é um ES module puro: nenhum import, nada de node:*. */

const T = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

export const ICONES = Object.freeze({
  seta: T('<path d="M5 12h13M13 6l6 6-6 6"/>'),
  setaCima: T('<path d="M7 17 17 7M9 7h8v8"/>'),
  anterior: T('<path d="M15 5l-7 7 7 7"/>'),
  seguinte: T('<path d="M9 5l7 7-7 7"/>'),
  menu: T('<path d="M4 9h16M4 15h16"/>'),
  fechar: T('<path d="M6 6l12 12M18 6 6 18"/>'),
  check: T('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  telefone: T('<path d="M6.6 3.5h2.6l1.4 4-1.9 1.3a12 12 0 0 0 6.5 6.5l1.3-1.9 4 1.4v2.6A2 2 0 0 1 18.4 20 15.4 15.4 0 0 1 4 5.6a2 2 0 0 1 2.6-2.1Z"/>'),
  email: T('<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="m4.5 7 7.5 6 7.5-6"/>'),
  instagram: T('<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".6" fill="currentColor"/>'),
  local: T('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>'),
  relogio: T('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  orcamento: T('<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20Z"/><path d="M14 3.5V8h4M9.5 12h5M9.5 15.5h5"/>'),
  estrela: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.5c.6 5 3.6 8 8.5 8.6-4.9.6-7.9 3.6-8.5 8.6-.6-5-3.6-8-8.5-8.6 4.9-.6 7.9-3.6 8.5-8.6Z"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5 5.1-1.3A9.9 9.9 0 1 0 12.04 2Zm0 18.1c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3a8.2 8.2 0 1 1 7 3.8Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.7 2.6 4.1 3.6 1.5.7 2.1.7 2.9.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>',
  // espaços
  casa: T('<path d="M3.5 11.5 12 4.5l8.5 7"/><path d="M6 9.8v10.7h12V9.8"/><path d="M10 20.5v-5.5h4v5.5"/>'),
  escritorio: T('<rect x="5.5" y="3.5" width="13" height="17" rx="1.5"/><path d="M9 7.5h1.5M13.5 7.5H15M9 11h1.5M13.5 11H15M9 14.5h1.5M13.5 14.5H15M10.5 20.5v-2.5h3v2.5"/>'),
  fabrica: T('<path d="M3.5 20.5h17M4.5 20.5v-9l5 3v-3l5 3V5h4v15.5"/><path d="M7.5 17.5h1.5M11.5 17.5H13"/>'),
  predio: T('<path d="M3.5 20.5h17M5.5 20.5V6.5l7-3v17M12.5 9.5l6 2v9"/><path d="M8 9h1.5M8 12.5h1.5M8 16h1.5M15 14.5h1M15 17.5h1"/>'),
  chave: T('<circle cx="8" cy="15.5" r="4"/><path d="m10.9 12.6 8.6-8.6M16.5 7l2.3 2.3M14.4 9.1l1.6 1.6"/>'),
  loja: T('<path d="M4 9.5 5.5 4.5h13L20 9.5"/><path d="M4 9.5c0 1.4 1.2 2.5 2.7 2.5s2.6-1.1 2.6-2.5c0 1.4 1.2 2.5 2.7 2.5s2.7-1.1 2.7-2.5c0 1.4 1.1 2.5 2.6 2.5S20 10.9 20 9.5"/><path d="M5.5 12v8.5h13V12M10 20.5v-4.5h4v4.5"/>'),
  cruz: T('<path d="M9.5 4.5h5v5h5v5h-5v5h-5v-5h-5v-5h5z"/>'),
  haltere: T('<path d="M3.5 9.5v5M6.5 7v10M17.5 7v10M20.5 9.5v5M6.5 12h11"/>'),
  taca: T('<path d="M8 3.5h8l-.8 5.6a3.2 3.2 0 0 1-6.4 0Z"/><path d="M12 12.5v6M8.5 20.5h7M8.4 7h7.2"/>'),
  capacete: T('<path d="M4.5 16a7.5 7.5 0 0 1 15 0"/><path d="M2.5 16h19v3h-19z"/><path d="M10 9V6.5h4V9"/>'),
  coworking: T('<circle cx="7.5" cy="7.3" r="2.2"/><circle cx="16.5" cy="7.3" r="2.2"/><path d="M3.8 14c.4-2.2 1.8-3.5 3.7-3.5s3.3 1.3 3.7 3.5M12.8 14c.4-2.2 1.8-3.5 3.7-3.5s3.3 1.3 3.7 3.5"/><path d="M2.5 14.5h19M5.5 14.5v6M18.5 14.5v6"/>'),
  torre: T('<path d="M3.5 20.5h17"/><rect x="5" y="8" width="7" height="12.5" rx=".8"/><rect x="12" y="3.5" width="7" height="17" rx=".8"/><path d="M5 12h7M5 16h7M12 7.8h7M12 12h7M12 16.2h7"/>'),
  // porquê
  frasco: T('<path d="M8.5 10.5h6l1 2.5v7.5h-8V13Z"/><path d="M10 10.5V7h3.5v3.5M13.5 7h3.5l1.5-2M9.5 5h4.5"/>'),
  pessoas: T('<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0"/><circle cx="16.5" cy="9.5" r="2.4"/><path d="M15.4 14.4a4.5 4.5 0 0 1 5.1 4.6"/>'),
  plano: T('<rect x="4.5" y="5.5" width="15" height="15" rx="2.5"/><path d="M4.5 10h15M8.5 3.5v4M15.5 3.5v4M8 14h3M8 17h6"/>'),
  lupa: T('<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/><path d="m8 10.6 1.9 1.9 3.3-3.3"/>'),
  escudo: T('<path d="M12 3.5 19 6v5.5c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6Z"/><path d="m9 12 2.2 2.2L15.5 10"/>'),
  // lavandaria
  camisa: T('<path d="M9 3.5 4 6l1.5 4 2-1v11.5h9V9l2 1L20 6l-5-2.5c-.5 1.4-1.6 2.2-3 2.2s-2.5-.8-3-2.2Z"/>'),
  cama: T('<path d="M3.5 18.5v-10M3.5 15h17v3.5M20.5 15v-2.5a2 2 0 0 0-2-2h-8V15"/><circle cx="7" cy="12.4" r="1.7"/>'),
  edredao: T('<rect x="4" y="5.5" width="16" height="13" rx="2.5"/><path d="M4 10.5h16M8.5 14.5h7"/>'),
  farda: T('<path d="M9 3.5 5 6v14.5h14V6l-4-2.5L12 7.5z"/><path d="M12 7.5v13M8 14h1.5M14.5 14H16"/>'),
  ferro: T('<path d="M3.5 17.5h17c0-4.1-3.2-7-7.2-7H8.2c-2.4 0-4.2 3-4.7 7Z"/><path d="M9.5 10.5l1-4h6.5"/>'),
  cortina: T('<path d="M3.5 4.5h17M6 4.5v16M18 4.5v16M6 4.5c0 6 2.8 10 5 16M18 4.5c0 6-2.8 10-5 16"/>'),
  // uma pilha de têxteis dobrados (o desenho das cortinas lia-se como um «M»)
  texteis: T('<rect x="4" y="4.5" width="16" height="4.5" rx="1.6"/><rect x="4" y="10" width="16" height="4.5" rx="1.6"/><rect x="4" y="15.5" width="16" height="4.5" rx="1.6"/><path d="M15 6.8h2.5M15 12.3h2.5M15 17.8h2.5"/>'),
  sapato: T('<path d="M3.5 17V9.5l4 1.5 2-2.5 3 3.5 6 2.3a2.2 2.2 0 0 1 2 2.2v1Z"/><path d="M3.5 20h17"/>'),
  hotel: T('<path d="M5 17.5a7 7 0 0 1 14 0M3.5 17.5h17M12 8V10.5M10.5 8h3M3.5 20.5h17"/>'),
  carrinha: T('<path d="M2.5 16.5v-9h11v9M13.5 10h4l3 3.5v3h-1.7"/><circle cx="7" cy="17" r="1.8"/><circle cx="16.8" cy="17" r="1.8"/><path d="M9 17h5.9"/>'),
  maquina: T('<rect x="4.5" y="3.5" width="15" height="17" rx="2.5"/><circle cx="12" cy="13" r="4.2"/><path d="M7.5 6.5H9M11 6.5h1"/>'),
});

/* Os desenhos que um cartão do site pode ter (os espaços, o «Porquê a NEVOA», o compromisso, a roupa e o quadro de
   uma divisão sem fotografia), pela ordem em que o painel os mostra, com o nome para o leitor de ecrã. As setas, o
   menu e as marcas das redes são do site, não dos cartões. */
export const ICONES_DOS_CARTOES = Object.freeze({
  casa: 'Casa', predio: 'Prédio', escritorio: 'Escritório', torre: 'Torres de escritórios', coworking: 'Coworking',
  fabrica: 'Fábrica', loja: 'Loja', cruz: 'Saúde', haltere: 'Ginásio', hotel: 'Hotelaria', chave: 'Chave',
  taca: 'Evento', capacete: 'Obra', frasco: 'Produto de limpeza', pessoas: 'Equipa', plano: 'Plano', relogio: 'Relógio',
  lupa: 'Controlo de qualidade', escudo: 'Confiança', estrela: 'Brilho', orcamento: 'Orçamento', local: 'Morada',
  camisa: 'Camisa', cama: 'Roupa de cama', edredao: 'Edredão', farda: 'Farda', ferro: 'Ferro de engomar',
  cortina: 'Cortinados', texteis: 'Têxteis', sapato: 'Calçado', maquina: 'Máquina de lavar', carrinha: 'Carrinha',
});
