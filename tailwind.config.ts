import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:       '#0a0a0f',
        surface:  '#12121a',
        surface2: '#1a1a26',
        accent:   '#c8f542',
        accent2:  '#5b4fff',
        muted:    '#6b6b80',
        danger:   '#ff4d6d',
        warn:     '#ffd166',
        success:  '#4dffa0',
      },
      fontFamily: {
        sans:  ['DM Sans', 'sans-serif'],
        mono:  ['DM Mono', 'monospace'],
        serif: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
