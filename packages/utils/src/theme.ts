export const colors = {
  background: '#0D0D14',
  surface: '#13121F',
  surfaceBorder: 'rgba(180, 100, 255, 0.12)',
  purple: '#8B2BFF',
  violet: '#C84BFF',
  pink: '#FF6BAA',
  green: '#00FFA0',
  text: '#F0EEFF',
  textMuted: '#6B5A8A',
  textSecondary: '#D0C8E8',
  textDim: '#9A8AB0',
} as const;

export const fonts = {
  heading: 'Syne',
  body: 'DM Sans',
} as const;

export const gradients = {
  purple: ['#8B2BFF', '#C84BFF'] as const,
  hero: ['#6B1FCC', '#A83BEE'] as const,
  pink: ['#C43090', '#FF6BAA'] as const,
};
