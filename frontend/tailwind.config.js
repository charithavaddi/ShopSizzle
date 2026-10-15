/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: '#0B0D10',
        surface: {
          DEFAULT: '#12161C',
          elevated: '#191F27',
          subtle: '#151A22',
        },
        border: {
          DEFAULT: '#292F38',
          subtle: '#1F242C',
          bright: '#3D4552',
        },
        primary: {
          DEFAULT: '#F3F5F7',
          muted: '#C4CAD4',
        },
        secondary: {
          DEFAULT: '#929BA8',
          muted: '#687383',
        },
        accent: {
          DEFAULT: '#72A7FF',
          hover: '#8BB7FF',
          subtle: 'rgba(114, 167, 255, 0.12)',
        },
        success: {
          DEFAULT: '#4BCB91',
          subtle: 'rgba(75, 203, 145, 0.12)',
        },
        warning: {
          DEFAULT: '#F2B85B',
          subtle: 'rgba(242, 184, 91, 0.12)',
        },
        error: {
          DEFAULT: '#F07178',
          subtle: 'rgba(240, 113, 120, 0.12)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
        'elevated': '0 10px 30px -5px rgba(0, 0, 0, 0.6), 0 4px 6px -2px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
}