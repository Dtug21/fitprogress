/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#00C4B4',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        surface: '#1A1A2E',
        card: '#16213E',
        border: '#0F3460',
      },
    },
  },
  plugins: [],
};
