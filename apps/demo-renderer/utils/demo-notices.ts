// Textos de compliance obrigatórios (spec §19 e §21) e diretiva de robots (§20).
// Centralizados para consistência e para serem verificáveis.

export const ROBOTS_DIRECTIVE = 'noindex, nofollow, noarchive';

/** Aviso obrigatório no topo da demonstração (§19). */
export const DEMO_TOP_NOTICE = {
  title: 'Demonstração de site',
  body: 'Esta é uma proposta visual criada pela Informatizou e ainda não representa o site oficial deste estabelecimento.',
};

/** Aviso obrigatório no rodapé da demonstração (§19). */
export const DEMO_FOOTER_NOTICE = {
  line1: 'Demonstração não oficial criada para apresentação comercial.',
  line2: 'As informações exibidas foram obtidas de fontes públicas e devem ser confirmadas pelo estabelecimento antes da publicação oficial.',
};

/** Conteúdo da página de demonstração indisponível/expirada (§21). */
export const DEMO_UNAVAILABLE = {
  title: 'Esta demonstração não está mais disponível.',
  body: 'O projeto foi criado pela Informatizou como uma proposta visual temporária.',
  question: 'Deseja criar um site profissional para sua empresa?',
  cta: 'Falar com a Informatizou',
};
