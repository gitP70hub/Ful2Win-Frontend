/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      sans: [
        'Inter',
        'Roboto',
        'Helvetica Neue',
        'Segoe UI',
        'Arial',
        'system-ui',
        '-apple-system',
        'BlinkMacSystemFont',
        'sans-serif',
      ],
      heading: ['Inter', 'sans-serif'],
      mono: [
        'SFMono-Regular',
        'Menlo',
        'Monaco',
        'Consolas',
        'Liberation Mono',
        'Courier New',
        'monospace',
      ],
    },
    extend: {
      fontFamily: {
        heading: ['Poppins', 'Inter', 'sans-serif'],
      },
      fontSize: {
        // fine-tuned sizes for better mobile readability
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      colors: {
        active: "#FFC107",
        dullBlue: "#AECBF9",
        bgColor: "#000B18",
      },
      backgroundImage: {
        whiteGradient: "linear-gradient(to bottom right, #ffffff, #f0f0f0)",
        // blueGradient: "linear-gradient(to bottom, #000B18, #002B5A, #00498E)",
        blueGradient: "linear-gradient(to bottom, #0A2472 0%, #0D47A1 45%, #1565C0 100%)",
        blueHorizontalGradient: "linear-gradient(to left, #0A2472 0%, #0D47A1 45%, #1565C0 100%)",
        darkBlueGradient: "linear-gradient(to bottom, #021242, #0D34A7)",
        neonBlueGradient: "linear-gradient(to bottom right, #00cfff, #00b8ff, #007bff)",
        glassDark: "linear-gradient(to bottom right, rgba(31, 41, 55, 0.1), rgba(0, 0, 0, 0.1))",
        blueGradient: "linear-gradient(to bottom right, #1565C0, #0D47A1, #0A2472)",
        communityGradient:"linear-gradient(to bottom, #1565C0 0%, #0D47A1 42%, #0A2472 100%)",
      },
      animation: {
        'fade-in-out': 'fadeInOut 2s ease-in-out',
      },
      keyframes: {
        fadeInOut: {
          '0%, 100%': { opacity: '0' },
          '25%, 75%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
