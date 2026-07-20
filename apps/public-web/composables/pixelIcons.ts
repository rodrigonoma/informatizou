/* ============================================================================
   Motor de pixel-art: uma grade de caracteres vira SVG (rects por "run").
   Cada ícone é desenhado com contorno, luz (canto sup-esq) e sombra
   (canto inf-dir) — visual de ícone clássico. Desenho original.
   ========================================================================== */

type Palette = Record<string, string>;

function render(rows: string[], pal: Palette): string {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  let rects = '';
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      if (c === '.' || c === ' ') {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < row.length && row[x + run] === c) run++;
      rects += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${pal[c] ?? '#000'}"/>`;
      x += run;
    }
  }
  return `<svg viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${rects}</svg>`;
}

// -- Documento (Leia-me) ------------------------------------------------------
const doc = render(
  [
    '.KKKKKKKKKKK....',
    '.KWWWWWWWKfK....',
    '.KWWWWWWWKfK....',
    '.KWWWWWWWWWKS...',
    '.KWbbbbbWWWKS...',
    '.KWWWWWWWWWKS...',
    '.KWgggggggWKS...',
    '.KWWWWWWWWWKS...',
    '.KWgggggggWKS...',
    '.KWWWWWWWWWKS...',
    '.KWgggggggWKS...',
    '.KWWWWWWWWWKS...',
    '.KWgggggWWWKS...',
    '.KWWWWWWWWWKS...',
    '.KKKKKKKKKKKS...',
    '..SSSSSSSSSSS...',
  ],
  { K: '#4a4a52', W: '#ffffff', f: '#d7d9e0', S: '#00000033', b: '#1560d0', g: '#9aa0aa' },
);

// -- Monitor com site (Criador de Sites) -------------------------------------
const site = render(
  [
    '.KKKKKKKKKKKKKK.',
    '.KLMMMMMMMMMMMDK',
    '.KMKKKKKKKKKKMDK',
    '.KMKbbbbbbbbKMDK',
    '.KMKWWWWWWWWKMDK',
    '.KMKWqWWrWWWKMDK',
    '.KMKWcccWcccKMDK',
    '.KMKWWWWWWWWKMDK',
    '.KMKKKKKKKKKKMDK',
    '.KMMMMMMMMMMMDDK',
    '.KDDDDDDDDDDDDDK',
    '.KKKKKKKKKKKKKK.',
    '.....KnnnnK.....',
    '.....KnnnnK.....',
    '...KKKKKKKKKK...',
    '...KLMMMMMMDK...',
  ],
  {
    K: '#3a3a3a',
    L: '#efe9db',
    M: '#d7d0be',
    D: '#a89f88',
    b: '#1560d0',
    W: '#ffffff',
    c: '#aac0e6',
    q: '#2fbf5a',
    r: '#ff8a3a',
    n: '#6f6957',
  },
);

// -- Balão de chat (ChatBot WhatsApp) ----------------------------------------
const chat = render(
  [
    '..KKKKKKKKKKKK..',
    '.KGGGGGGGGGGGGK.',
    '.KGgggggggggggK.',
    '.KgggggggggggdK.',
    '.KggWWggWWggWdK.',
    '.KggWWggWWggWdK.',
    '.KgggggggggggdK.',
    '.KgggggggggggdK.',
    '.KddddddddddddK.',
    '.KKKKKKKKKKKKK..',
    '..KggK..........',
    '..KgK...........',
    '..KK............',
  ],
  { K: '#166a31', G: '#54e089', g: '#28c85f', d: '#1f9c49' },
);

// -- Envelope amarelo (E-mail Corporativo) -----------------------------------
const mail = render(
  [
    '.KKKKKKKKKKKKKK.',
    '.KWYYYYYYYYYYYK.',
    '.KYdYYYYYYYYdYK.',
    '.KYydYYYYYYdyYK.',
    '.KYYydYYYYdyYYK.',
    '.KYYYydYYdyYYYK.',
    '.KYYYYydddyYYYK.',
    '.KYYYYYYYYYYYYK.',
    '.KYYYYYYYYYYYYK.',
    '.KddddddddddddK.',
    '.KKKKKKKKKKKKKK.',
  ],
  { K: '#8a6d1a', W: '#fff6c0', Y: '#ffe272', y: '#f4c944', d: '#d3a520' },
);

// -- Servidor (Hospedagem) ----------------------------------------------------
const server = render(
  [
    '.KKKKKKKKKKKKKK.',
    '.KLLLLLLLLLLLDK.',
    '.KMGkkkkkkkkMDK.',
    '.KMMMMMMMMMMMDK.',
    '.KDDDDDDDDDDDDK.',
    '.KKKKKKKKKKKKKK.',
    '.KKKKKKKKKKKKKK.',
    '.KLLLLLLLLLLLDK.',
    '.KMGkkkkkkkkMDK.',
    '.KMMMMMMMMMMMDK.',
    '.KDDDDDDDDDDDDK.',
    '.KKKKKKKKKKKKKK.',
  ],
  { K: '#33363c', L: '#e6e8ec', M: '#c3c7cd', D: '#8f95a0', G: '#2ecc40', k: '#5a5f6a' },
);

// -- Engrenagem (Manutenção) --------------------------------------------------
const gear = render(
  [
    '.......KK.......',
    '.....K.KK.K.....',
    '....KKMMMMKK....',
    '...KMMMMMMMMK...',
    '..K.MMMhhMMM.K..',
    '.KKMMMhLLhMMMKK.',
    '.K.MMhLLLLhMM.K.',
    '.K.MMhLLLLhMM.K.',
    '.KKMMMhLLhMMMKK.',
    '..K.MMMhhMMM.K..',
    '...KMMMMMMMMK...',
    '....KKMMMMKK....',
    '.....K.KK.K.....',
    '.......KK.......',
  ],
  { K: '#33363c', M: '#c3c7cd', L: '#eaecef', h: '#5c6069' },
);

// -- Sacola de compras (Loja Online) -----------------------------------------
const bag = render(
  [
    '.....K....K.....',
    '....K......K....',
    '....K......K....',
    '..KKKKKKKKKKKK..',
    '.KLRRRRRRRRRRdK.',
    '.KRRRRRRRRRRRdK.',
    '.KRRRWWWWRRRRdK.',
    '.KRRRRRRRRRRRdK.',
    '.KRRRRRRRRRRRdK.',
    '.KRRRRRRRRRRRdK.',
    '.KRRRRRRRRRRRdK.',
    '.KddddddddddddK.',
    '.KKKKKKKKKKKKKK.',
  ],
  { K: '#7a1f3a', R: '#ff4d6d', d: '#c62949', L: '#ff90a6', W: '#ffd9e0' },
);

// -- Telefone (Contato) -------------------------------------------------------
const phone = render(
  [
    '..KKKKKKKKKKKK..',
    '.KGGGGGGGGGGGGK.',
    '.KGWWGGGGGGWWGK.',
    '.KGGGGGGGGGGGGK.',
    '.KddddddddddddK.',
    '...K......K.....',
    '...K......K.....',
    '..KKKKKKKKKKKK..',
    '.KGGGGGGGGGGGGK.',
    '.KGdWdWdWdWdGGK.',
    '.KGdWdWdWdWdGGK.',
    '.KGGGGGGGGGGGGK.',
    '.KddddddddddddK.',
    '..KKKKKKKKKKKK..',
  ],
  { K: '#0f3d20', G: '#2ec76a', d: '#1c8043', W: '#bff5d2' },
);

export const ICON_SVG: Record<string, string> = {
  doc,
  site,
  chat,
  mail,
  server,
  gear,
  bag,
  phone,
};
