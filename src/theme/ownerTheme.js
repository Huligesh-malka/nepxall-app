// src/theme/ownerTheme.js
export const ownerColors = {
  primary: {
    main: '#5E60CE',
    light: '#7B7FEA',
    dark: '#4849A1',
    gradient: 'linear-gradient(135deg, #5E60CE 0%, #7B7FEA 100%)'
  },
  secondary: {
    main: '#2EC4B6',
    light: '#56D9CC',
    dark: '#249C90'
  },
  success: '#4CAF50',
  warning: '#FF9F1C',
  error: '#E71D36',
  info: '#2E86DE',
  background: '#F6F7FB',
  card: '#FFFFFF',
  text: {
    primary: '#1E293B',
    secondary: '#64748B',
    muted: '#94A3B8'
  }
};

export const ownerShadows = {
  card: '0 4px 20px rgba(0, 0, 0, 0.02)',
  hover: '0 8px 30px rgba(94, 96, 206, 0.08)',
  sidebar: '4px 0 25px rgba(0, 0, 0, 0.03)'
};

export const ownerStyles = {
  card: {
    borderRadius: 4,
    border: '1px solid #E9ECF1',
    boxShadow: ownerShadows.card,
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: ownerShadows.hover,
      transform: 'translateY(-2px)'
    }
  }
};