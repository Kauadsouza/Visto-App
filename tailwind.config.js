/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // O padrão do Tailwind é 'media', que faz o NativeWindDerivar o esquema de
  // cor do sistema. Na web o navigator chama setColorScheme() e o NativeWind
  // lança: "Cannot manually set color scheme, as dark mode is type 'media'".
  //
  // 'class' resolve. E não custa nada aqui: o app não usa nenhuma variante
  // `dark:` — o fundo escuro vem de cores explícitas (bg-fundo, text-texto),
  // então a paleta continua idêntica nos dois esquemas.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Fundo escuro
        fundo: '#0A0A0A',
        'fundo-2': '#0F1115',
        superficie: '#161A1D',
        'superficie-2': '#1F2429',
        borda: '#2A2F34',

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

        // Texto
        texto: '#FFFFFF',
        'texto-2': '#A1A1AA',
        'texto-3': '#71717A',

        // Semânticos
        sucesso: '#16A34A',
        atencao: '#F59E0B',
        erro: '#DC2626',
        info: '#3B82F6',
      },
    },
  },
  plugins: [],
};