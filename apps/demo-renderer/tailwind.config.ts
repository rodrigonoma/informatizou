import type { Config } from 'tailwindcss';

export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          500: '#3366ff',
          600: '#1f47f5',
          700: '#1836e1',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
