import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // Mobile-first breakpoints
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
    },
    extend: {
      colors: {
        // Fernhill Dance color palette - matches fernhilldance.com
        // Dark, moody, organic with golden accents
        'fernhill': {
          'dark': '#0f0f0f',      // Near black - main background
          'charcoal': '#1a1a1a',  // Dark charcoal - card backgrounds
          'brown': '#2a221c',     // Warm brown tint
          'earth': '#3d3027',     // Earthy brown
          'terracotta': '#b87333', // Warm copper/terracotta
          'sand': '#c9b896',      // Warm sand - text
          'cream': '#f5ebe0',     // Light cream - headings
          'gold': '#d4a855',      // Golden accent - CTAs (matches website)
          'moss': '#4a5d23',      // Forest moss
          'forest': '#2d4a1c',    // Deep forest
        },
        // Legacy aliases for backwards compatibility
        'sacred-charcoal': '#0f0f0f',
        'forest-green': '#2d4a1c',
        'sacred-gold': '#d4a855',
      },
      fontFamily: {
        // Matches fernhilldance.com typography
        'display': ['Playfair Display', 'Georgia', 'serif'],
        'body': ['system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-earth': 'linear-gradient(135deg, #2a221c 0%, #0f0f0f 100%)',
        'gradient-warm': 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
        'gradient-gold': 'linear-gradient(135deg, #d4a855 0%, #b87333 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      minHeight: {
        'touch': '44px',
        'touch-lg': '48px',
      },
      minWidth: {
        'touch': '44px',
      },
      borderRadius: {
        'organic': '2rem 0.5rem 2rem 0.5rem',
      },
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-out',
        'slideUp': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
