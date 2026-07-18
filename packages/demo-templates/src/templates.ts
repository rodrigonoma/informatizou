/** Os 7 templates da spec §16. */
export const TEMPLATE_KEYS = [
  'modern-food',
  'local-classic',
  'professional-services',
  'health-clean',
  'beauty-elegant',
  'automotive-dark',
  'retail-modern',
] as const;

export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

/** Mapa categoria → template (spec §16). */
const TEMPLATE_BY_CATEGORY: Record<string, TemplateKey> = {
  bakery: 'modern-food',
  restaurant: 'modern-food',
  pizzeria: 'modern-food',
  cafe: 'modern-food',
  clinic: 'health-clean',
  dentist: 'health-clean',
  doctor: 'health-clean',
  beautysalon: 'beauty-elegant',
  salon: 'beauty-elegant',
  barbershop: 'beauty-elegant',
  accountant: 'professional-services',
  lawyer: 'professional-services',
  consultant: 'professional-services',
  mechanic: 'automotive-dark',
  autorepair: 'automotive-dark',
  store: 'retail-modern',
  shop: 'retail-modern',
  petshop: 'retail-modern',
  default: 'local-classic',
};

/** Seleciona o template pela categoria da empresa (spec §16). */
export function selectTemplate(category?: string | null): TemplateKey {
  if (!category) return 'local-classic';
  const key = category.toLowerCase().replace(/[^a-z]/g, '');
  return TEMPLATE_BY_CATEGORY[key] ?? 'local-classic';
}

export interface DesignTokens {
  primary: string;
  primaryDark: string;
  accent: string;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  fontHeading: string;
  fontBody: string;
  radius: string;
  mood: 'warm' | 'clean' | 'elegant' | 'dark' | 'vibrant' | 'professional';
  heroStyle: 'image-overlay' | 'split' | 'centered' | 'gradient';
}

/** Presets de design por template — cada um com identidade visual distinta. */
export const DESIGN_PRESETS: Record<TemplateKey, DesignTokens> = {
  'modern-food': {
    primary: '#e0532f',
    primaryDark: '#b83d1e',
    accent: '#f6b93b',
    bg: '#fffaf5',
    surface: '#ffffff',
    text: '#2b1a12',
    muted: '#8a6f60',
    fontHeading: "'Poppins', sans-serif",
    fontBody: "'Inter', sans-serif",
    radius: '1rem',
    mood: 'warm',
    heroStyle: 'image-overlay',
  },
  'local-classic': {
    primary: '#2f6f4e',
    primaryDark: '#245740',
    accent: '#c9a227',
    bg: '#fbfbf9',
    surface: '#ffffff',
    text: '#22271f',
    muted: '#6b7268',
    fontHeading: "'Merriweather', serif",
    fontBody: "'Inter', sans-serif",
    radius: '0.5rem',
    mood: 'professional',
    heroStyle: 'split',
  },
  'professional-services': {
    primary: '#1f47f5',
    primaryDark: '#1836b6',
    accent: '#0ea5e9',
    bg: '#f7f9fc',
    surface: '#ffffff',
    text: '#111827',
    muted: '#6b7280',
    fontHeading: "'Inter', sans-serif",
    fontBody: "'Inter', sans-serif",
    radius: '0.75rem',
    mood: 'professional',
    heroStyle: 'centered',
  },
  'health-clean': {
    primary: '#0ea5a4',
    primaryDark: '#0b807f',
    accent: '#38bdf8',
    bg: '#f5fbfb',
    surface: '#ffffff',
    text: '#0f2f2e',
    muted: '#5f7d7c',
    fontHeading: "'Nunito', sans-serif",
    fontBody: "'Inter', sans-serif",
    radius: '1.25rem',
    mood: 'clean',
    heroStyle: 'split',
  },
  'beauty-elegant': {
    primary: '#a8306f',
    primaryDark: '#832356',
    accent: '#e6a4c4',
    bg: '#fdf7fb',
    surface: '#ffffff',
    text: '#2a1220',
    muted: '#8a6478',
    fontHeading: "'Playfair Display', serif",
    fontBody: "'Inter', sans-serif",
    radius: '1.5rem',
    mood: 'elegant',
    heroStyle: 'gradient',
  },
  'automotive-dark': {
    primary: '#ef4444',
    primaryDark: '#b91c1c',
    accent: '#f59e0b',
    bg: '#0d1117',
    surface: '#161b22',
    text: '#f3f4f6',
    muted: '#9aa4b2',
    fontHeading: "'Oswald', sans-serif",
    fontBody: "'Inter', sans-serif",
    radius: '0.5rem',
    mood: 'dark',
    heroStyle: 'image-overlay',
  },
  'retail-modern': {
    primary: '#7c3aed',
    primaryDark: '#5b21b6',
    accent: '#ec4899',
    bg: '#faf7ff',
    surface: '#ffffff',
    text: '#1f142e',
    muted: '#6b6280',
    fontHeading: "'Sora', sans-serif",
    fontBody: "'Inter', sans-serif",
    radius: '1rem',
    mood: 'vibrant',
    heroStyle: 'gradient',
  },
};

/** Retorna os tokens de design de um template. */
export function designTokensFor(template: TemplateKey): DesignTokens {
  return DESIGN_PRESETS[template];
}
