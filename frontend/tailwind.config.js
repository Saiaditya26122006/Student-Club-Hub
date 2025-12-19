module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ai: {
          50: '#F2F4F5',
          100: '#E3E6E8',
          200: '#C9CED2',
          300: '#ADB3B9',
          400: '#9299A2',
          500: '#78808B',
          600: '#5F6873',
          700: '#4A525C',
          800: '#343A42',
          900: '#191E24',
        },
        holo: {
          100: '#E9ECF1',
          200: '#D4D9E0',
          300: '#B7BEC8',
          400: '#9BA5B3',
          500: '#7E8A97',
        },
        pulse: {
          300: '#9AA4B1',
          400: '#7B8591',
          500: '#5C6671',
          600: '#3D454D',
        },
      },
      fontFamily: {
        'student': ['Inter', 'system-ui', 'sans-serif'],
        'aitech': ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'ai-card': '0 25px 60px rgba(3, 7, 18, 0.65)',
        'ai-glow': '0 0 18px rgba(34, 211, 238, 0.55)',
      },
    },
  },
  plugins: [],
}









