/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        gestro: {
          green: '#00C278',
          greenDark: '#009B5F',
        },
        dark: {
          background: '#121212',
          surface: '#1E1E1E',
          surfaceSecondary: '#2C2C2C',
          textPrimary: '#FFFFFF',
          textSecondary: '#A0A0A0',
          border: '#333333',
        },
        light: {
          background: '#F0F2F5',
          surface: '#FFFFFF',
          surfaceSecondary: '#E8EAED',
          textPrimary: '#1A1A1A',
          textSecondary: '#666666',
          border: '#E0E0E0',
        }
      }
    },
  },
  plugins: [],
}

