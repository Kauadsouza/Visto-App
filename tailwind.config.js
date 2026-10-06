/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // O padrão do Tailwind é 'media', que faz o NativeWind derivar o esquema de
  // cor do sistema. Na web o navigator chama setColorScheme() e o NativeWind
  // lança: "Cannot manually set color scheme, as dark mode is type 'media'".
  //
  // 'class' resolve. E não custa nada aqui: o app não usa nenhuma variante
  // `dark:` — o fundo escuro vem de cores explícitas, então a paleta continua
  // idêntica nos dois esquemas.
  darkMode: 'class',

  theme: {
    // ---------------------------------------------------------------
    // Tipografia
    //
    // lineHeight explícito em toda parte: no React Native o padrão do
    // navegador não existe, e fonte sem lineHeight corta acento e descida
    // da letra. Os pares são [tamanho, entrelinha].
    // ---------------------------------------------------------------
    fontSize: {
      // rótulos pequenos, em maiúscula, com respiro entre letras
      'label': ['11px', { lineHeight: '14px', letterSpacing: '1.4px' }],
      'caption': ['12px', { lineHeight: '17px' }],
      'sm': ['14px', { lineHeight: '21px' }],
      'base': ['16px', { lineHeight: '24px' }],
      'lg': ['18px', { lineHeight: '27px' }],
      'xl': ['20px', { lineHeight: '28px' }],
      '2xl': ['24px', { lineHeight: '31px' }],
      '3xl': ['30px', { lineHeight: '37px' }],
      '4xl': ['36px', { lineHeight: '43px' }],
    },

    // ---------------------------------------------------------------
    // Raios
    // ---------------------------------------------------------------
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
        // Camadas de fundo, do mais fundo ao mais elevado
        fundo: '#0A0A0A',
        'fundo-2': '#0E1116',
        superficie: '#14181D',
        'superficie-2': '#1B2026',
        'superficie-3': '#232930',

        // Bordas: a hierarquia vem daqui, não de sombra
        borda: '#22282F',
        'borda-forte': '#323A43',
        'borda-verde': '#1F7A3C',

        // Verde primário
        verde: {
          DEFAULT: '#16A34A',
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

        texto: '#FFFFFF',
        // Secondary mais claro que antes: #A1A1AA ficava washes out sobre preto
        'texto-2': '#C2C9D1',
        'texto-3': '#8A929C',
        'texto-4': '#5F6873',

        atencao: '#F5A524',
        erro: '#EF4444',
        info: '#3B82F6',
      },

      spacing: {
        // Ritmo de respiro para telas de conteúdo longo
        18: '72px',
        22: '88px',
      },
    },
  },
  plugins: [],
};