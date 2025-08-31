import { TextStyle } from 'react-native';

// consistent spacing units
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
};

// consistent border radii
export const radius = {
  sm: 4,
  md: 8,
  lg: 16,
  full: 999,
};

// consistent typography styles
export const typography: { [key: string]: TextStyle } = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
  },
  button: {
    fontSize: 16,
    fontWeight: 'bold',
  },
};

export const StyleGuide = {
  spacing,
  radius,
  typography,
};