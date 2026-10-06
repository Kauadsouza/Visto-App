/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // O Tailwind usa 'media' por padrão e isso quebra no navegador
  // (NativeWind lança "Cannot manually set color scheme").
  // 'class' resolve. O app aplica `dark` ou `light` no `<html>` para trocar.
  darkMode: 'class',

  theme: {
    fontSize: {
      'label': ['11px', { lineHeight: '14px', letterSpacing: '1.4px' }],
      'caption': ['12px', { lineHeight: '17px' }],
      'sm': ['14px', { lineHeight: '21px' }],
      'base': ['16px', { lineHeight: '24px' }],
      'lg': ['18px', { lineHeight: '27px' }],
      'xl': ['20px', { lineHeight: '28px' }],
      '2xl': ['24px', { lineHeight: '31px' }],
      '3xl': ['30px', { lineHeight: '37px' }],
      '4xl': ['36px', { lineHeight: '43px' }],
      '5xl': ['44px', { lineHeight: '52px' }],
    },

    borderRadius: {
      sm: '8px',
      DEFAULT: '12px',
      lg: '16px',
      xl: '20px',
      '2xl': '26px',
      '3xl': '32px',
      full: '9999px',
    },

    extend: {
      colors: {
        // ----- Brand -----
        brand: {
          DEFAULT: '#22C55E',
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },

        // ----- Modo DARK (padrão) -----
        // Tem matiz de marca no fundo, não preto puro — mais vivo.
        fundo: '#0B0F0C',
        'fundo-2': '#101511',
        superficie: '#161B17',
        'superficie-2': '#1E2420',
        'superficie-3': '#272E29',
        borda: '#252A26',
        'borda-forte': '#3A4039',
        'borda-verde': '#1F7A3C',

        texto: '#FFFFFF',
        'texto-2': '#D6DAD3',
        'texto-3': '#9CA39D',
        'texto-4': '#6F7671',

        // ----- Modo LIGHT (off-white quente) -----
        // Aplicado quando a classe `light` está na raiz.
        'fundo-claro': '#FAF8F4',
        'fundo-2-claro': '#F4F0E8',
        'superficie-claro': '#FFFFFF',
        'superficie-2-claro': '#F2EDE3',
        'superficie-3-claro': '#E8E1D2',
        'borda-claro': '#E2DAC7',
        'borda-forte-claro': '#C9C0A8',
        'borda-verde-claro': '#A8D4B0',
        'texto-claro': '#0F1311',
        'texto-2-claro': '#3F4541',
        'texto-3-claro': '#6A706B',
        'texto-4-claro': '#909999',

        atencao: '#F5A524',
        erro: '#EF4444',
        info: '#3B82F6',
        sucesso: '#16A34A',
      },

      spacing: {
        18: '72px',
        22: '88px',
      },

      // Sombras muito sutis — em fundo escuro sombra não aparece. Use só
      // para o modo claro, se a peça tiver elevação sobre um fundo claro.
      boxShadow: {
        'soft': '0 1px 2px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.04)',
        'lift': '0 4px 12px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.04)',
      },

      // A vida no app: dois backgrounds com matiz de marca diferentes
      backgroundImage: {
        'gradient-verde': ['linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'],
        'gradient-glow': [
          'radial-gradient(ellipse at top, rgba(34, 197, 94, 0.12) 0%, transparent 60%)',
        ],
        'grain':
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};