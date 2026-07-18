/**
 * Gera um slug seguro para URLs de demonstração (spec §18):
 * minúsculas, sem acentos, apenas [a-z0-9-], sem hífens duplicados/nas pontas.
 * Aceita sufixo de cidade opcional para desambiguar conflitos.
 */
export function slugify(name: string, opts: { citySuffix?: string } = {}): string {
  const base = normalizeSlugPart(name);
  const suffix = opts.citySuffix ? normalizeSlugPart(opts.citySuffix) : '';
  const joined = suffix ? `${base}-${suffix}` : base;
  return joined.replace(/^-+|-+$/g, '');
}

function normalizeSlugPart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove diacríticos combinantes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // não-alfanumérico vira hífen
    .replace(/-+/g, '-') // colapsa hífens
    .replace(/^-+|-+$/g, '');
}
