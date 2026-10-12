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
      'label': ['11px', { lineHeight: '14px', letterSpacing: '1.5px' }],
      'caption': ['12px', { lineHeight: '17px' }],
      'sm': ['14px', { lineHeight: '21px' }],
      'base': ['16px', { lineHeight: '24px' }],
      'lg': ['18px', { lineHeight: '27px' }],
      'xl': ['20px', { lineHeight: '29px', letterSpacing: '-0.1px' }],
      '2xl': ['24px', { lineHeight: '31px', letterSpacing: '-0.2px' }],
      '3xl': ['30px', { lineHeight: '36px', letterSpacing: '-0.4px' }],
      '4xl': ['36px', { lineHeight: '42px', letterSpacing: '-0.6px' }],
      '5xl': ['44px', { lineHeight: '50px', letterSpacing: '-0.8px' }],
    },

    // A marca é editorial: serif nos títulos, sem serifa no corpo e na UI.
    // Georgia existe no Windows e no macOS; no Android o serif do sistema
    // (Noto Serif) segura o mesmo papel.
    fontFamily: {
      serif: ['Georgia', 'serif'],
      sans: ['System', '-apple-system', 'Roboto', 'sans-serif'],
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
          DEFAULT: '#1B3A6B',
          50: '#F2F5FA',
          100: '#E3EAF4',
          200: '#C4D3E8',
          300: '#9DB6D6',
          400: '#6D92BE',
          500: '#4771A6',
          600: '#2F5A9E',
          700: '#1B3A6B',
          800: '#16305A',
          900: '#12294D',
        },

        // Dourado: selo de consultoria humana e valores. Uso raro de propósito.
        ouro: {
          DEFAULT: '#C9A227',
          100: '#F7EFD6',
          300: '#E3C767',
          700: '#8A6E14',
        },

        // ----- Modo LIGHT (padrão) -----
        // Papel quente, tinta quente, hairlines quentes.
        fundo: '#FBFAF8',
        'fundo-2': '#F5F2EC',
        superficie: '#FFFFFF',
        'superficie-2': '#F2EFE9',
        'superficie-3': '#E8E3D9',
        borda: '#E5E0D6',
        'borda-forte': '#CFC7B8',
        'borda-marca': '#B9C6DC',

        texto: '#16130F',
        'texto-2': '#4A453D',
        'texto-3': '#7A746A',
        'texto-4': '#A8A196',

        // ----- Modo DARK (noturno) -----
        'fundo-escuro': '#141210',
        'fundo-2-escuro': '#1C1A16',
        'superficie-escuro': '#232019',
        'superficie-2-escuro': '#2C2822',
        'superficie-3-escuro': '#38332B',
        'borda-escuro': '#35302A',
        'borda-forte-escuro': '#4C463C',
        'borda-marca-escuro': '#3E5578',

        'texto-escuro': '#F7F4EE',
        'texto-2-escuro': '#D3CCC0',
        'texto-3-escuro': '#9C9488',
        'texto-4-escuro': '#6E675E',

        atencao: '#B45309',
        erro: '#B3261E',
        info: '#1D4ED8',
        sucesso: '#15803D',
      },

      spacing: {
        18: '72px',
        22: '88px',
      },

      // Sombra existe de verdade em papel claro — é o que dá a sensação de
      // folha de papel sobre a mesa. Difícil e pequena.
      boxShadow: {
        'soft': '0 1px 2px rgba(22, 19, 15, 0.04), 0 2px 8px rgba(22, 19, 15, 0.04)',
        'lift': '0 2px 4px rgba(22, 19, 15, 0.04), 0 8px 24px rgba(22, 19, 15, 0.06)',
        'papel': '0 1px 3px rgba(22, 19, 15, 0.05), 0 12px 32px rgba(22, 19, 15, 0.07)',
      },

      backgroundImage: {
        'gradiente-marca': ['linear-gradient(135deg, #1B3A6B 0%, #12294D 100%)'],
        'gradiente-ouro': ['linear-gradient(135deg, #C9A227 0%, #8A6E14 100%)'],
      },
    },
  },
  plugins: [],
};