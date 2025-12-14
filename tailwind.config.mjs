/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      // Colors reference CSS custom properties for dynamic theming
      colors: {
        primary: '#494331',
        secondary: '#F3CA40',
        accent: '#F08A4B',
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
      // Spacing scale - MASTER SOURCE OF TRUTH (Tailwind way)
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
