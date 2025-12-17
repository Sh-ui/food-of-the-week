/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Base colors
        'primary': '#494331',
        'primary-hover': '#3a3626',
        'secondary': '#F3CA40',
        'secondary-hover': '#d9b130',
        'accent': '#F08A4B',
        
        // Text colors
        'text': '#3F3F37',
        'text-light': '#6b6a62',
        'text-muted': '#9a9a91',
        
        // Background colors
        'bg': '#FAF8F3',
        'bg-alt': '#F5F2EB',
        
        // Border colors
        'border': '#E8E3D8',
        
        // Cooked meal state colors
        'cooked-bg': '#f0ede6',
        'cooked-text': '#8a887f',
        'cooked-border': '#d8d4c9',
      },
      instructionPalette: [
        { name: 'salmon', color: '#D78A76' },
        { name: 'yellow', color: '#F3CA40' },
        { name: 'orange', color: '#F08A4B' },
      ],
      instructionSubsections: {
        info: { bg: 'bg-alt', border: 'secondary', heading: 'primary' },
        overrides: {
          // 0: { scheme: 'salmon' },
          // 2: { border: '#81E3F6' },
          // 5: { bg: 'bg-alt', border: 'accent', heading: 'primary' },
        },
      },
      fontFamily: {
        sans: ['Work Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        heading: ['Aleo', 'Georgia', 'Times New Roman', 'serif'],
        serif: ['Aleo', 'Georgia', 'Times New Roman', 'serif'],
      },
      // Responsive breakpoints - single source of truth
      screens: {
        'sm-mobile': { max: '500px' },
        'mobile': { max: '768px' },
        'tablet': { max: '950px' },
        'desktop': { max: '1000px' },
      },
      // Change these values here → entire site updates automatically
      // Creates utilities: p-xs, mb-md, gap-lg, etc.
      spacing: {
        'xs': '0.25rem',   // 4px
        'sm': '0.5rem',    // 8px
        'md': '1rem',      // 16px
        'lg': '1.5rem',    // 24px
        'xl': '2rem',      // 32px
      },
      // Line heights for our typography
      lineHeight: {
        'relaxed': '1.68',
        'loose': '1.72',
        'extra-loose': '1.75',
        'extra-tight': '1.2',
        'heading-h2': '1.3',
        'heading-h3': '1.4',
      },
      // Font sizes - using clamp for fluid typography
      fontSize: {
        'body': 'clamp(18px, 2.2vw, 20px)',
        'h1': 'clamp(2.4rem, 5vw, 2.8rem)',
        'h2': 'clamp(1.9rem, 4vw, 2.2rem)',
        'h3': 'clamp(1.4rem, 3.4vw, 1.7rem)',
      },
      // Font weights
      fontWeight: {
        'heading-bold': '700',
        'heading-semibold': '600',
      },
      // Specific sizes for form elements
      width: {
        'checkbox': '1.5rem',
        'checkbox-mobile': '1.6rem',
      },
      height: {
        'checkbox': '1.5rem',
        'checkbox-mobile': '1.6rem',
      },
      // Border radius matching our design
      borderRadius: {
        'DEFAULT': '6px',
        'lg': '8px',
        'xl': '12px',
      },
      // Max widths
      maxWidth: {
        'container': '1000px',
      },
    },
  },
  plugins: [],
};
