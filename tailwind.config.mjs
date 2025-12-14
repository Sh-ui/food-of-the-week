/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      // Colors are primarily managed via CSS custom properties set by components
      // This keeps the color logic in src/config/colors.ts as the source of truth
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
      // Responsive breakpoints - single source of truth for entire site
      screens: {
        'sm-mobile': { max: '500px' },   // Small mobile devices
        'mobile': { max: '768px' },       // Mobile devices
        'tablet': { max: '950px' },       // Tablet (switch to mobile nav)
        'desktop': { max: '1000px' },     // Desktop (abbreviated text)
      },
    },
  },
  plugins: [],
};
