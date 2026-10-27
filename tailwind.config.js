/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EAF3FB',
          100: '#CFE4F7',
          500: '#0A66C2',
          600: '#004182',
          700: '#003366',
          DEFAULT: '#0A66C2',
        },
        'app-bg': '#F3F2EF',
        'app-card': '#FFFFFF',
        'app-border': '#E5E7EB',
        'app-hover': '#EAF3FB',
        'app-text-main': '#1F2937',
        'app-text-sub': '#4B5563',
        'app-text-muted': '#9CA3AF',
        brand: {
          blue: "#0A66C2",
          darkBlue: "#004182",
          lightBlue: "#EAF3FB",
          green: "#057642",
          lightGreen: "#DCFCE7",
          amber: "#915907",
          lightAmber: "#FEF3C7",
          red: "#CC1016",
          lightRed: "#FEE2E2",
        }
      },
      borderRadius: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        'full': '9999px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
