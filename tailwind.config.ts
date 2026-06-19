import type { Config } from 'tailwindcss'

/**
 * Editorial / Cinematic design tokens.
 *
 * Scene: a film critic at a quiet press screening, dusk, paging through a thick
 * matte-paper anime film annual — the cover plates are enormous, the text
 * recedes to the margins. Near-black warm ink, warm paper for inverted plates,
 * a single ember accent (print-warm, never the SaaS violet). Serif display +
 * clean grotesk body + mono for the typeset stats rail.
 */
export default <Partial<Config>>{
  darkMode: 'class',
  content: [
    './components/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      colors: {
        // Warm near-black ink scale, chromatically tinted toward the ember hue
        // (never pure #000). Built in OKLCH, transcribed to hex.
        ink: {
          950: '#0b0a09', // page floor
          900: '#100e0c', // base canvas
          800: '#16130f', // raised panel
          700: '#1e1a15', // hairline-bordered surface
          600: '#2a251e', // quiet border
          500: '#3b342a', // active border
        },
        // Warm paper for inverted "plate" spreads.
        paper: {
          DEFAULT: '#f4ede0',
          dim: '#e7ddcb',
        },
        // Text scale on ink.
        bone: {
          100: '#f6f1e7', // brightest text on ink
          200: '#e7ddc9',
          300: '#cabfa6', // body on ink
          400: '#9d927d', // muted
        },
        muted: {
          DEFAULT: '#8c8270', // secondary text on ink (5.08:1 on ink-900)
          dim: '#857c69', // tertiary / captions (4.79:1 on ink-950, AA)
        },
        // The single restrained accent: warm ember (film-print warmth).
        ember: {
          DEFAULT: '#d8804a',
          soft: '#e7a06f',
          deep: '#b65f2f',
        },
      },
      fontFamily: {
        serif: [
          'Fraunces',
          'ui-serif',
          'Georgia',
          'Cambria',
          'Times New Roman',
          'serif',
        ],
        sans: [
          'Hanken Grotesk',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'IBM Plex Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
      letterSpacing: {
        kicker: '0.22em',
      },
      maxWidth: {
        measure: '68ch',
        prose: '40rem',
      },
      transitionTimingFunction: {
        // The one house curve (L1 invariant 3): a slow, confident decelerate.
        house: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
}
