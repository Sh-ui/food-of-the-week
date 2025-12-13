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
    },
  },
  plugins: [],
};
