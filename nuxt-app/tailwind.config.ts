import type { Config } from 'tailwindcss'
import daisyui from 'daisyui'

export default {
  content: [],
  plugins: [daisyui],
  daisyui: {
    themes: ['light', 'dark'],
    darkTheme: 'dark',
    base: true,
    styled: true,
    utils: true,
    logs: false,
  },
} satisfies Config
