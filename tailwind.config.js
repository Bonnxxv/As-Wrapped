/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mac: {
          canvas: '#161616',      // Deep space canvas
          sidebar: '#1E1E1E',     // Sleek macOS sidebar
          panel: '#282828',       // Main content panel
          surface: '#323232',     // Surfaces (cards, inputs)
          border: '#3F3F3F',      // Native thin border
          accent: '#0A84FF',      // macOS system active blue
          accentHover: '#0066CC', // Darker blue on hover
          text: '#F5F5F7',        // Apple-style typography light
          muted: '#8E8E93',       // Native muted gray
          traffic: {
            red: '#FF5F56',       // macOS window close
            yellow: '#FFBD2E',    // macOS window minimize
            green: '#27C93F'      // macOS window expand
          }
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif'
        ]
      },
      boxShadow: {
        'mac-shadow': '0 8px 30px rgba(0, 0, 0, 0.5)',
        'mac-popover': '0 4px 20px rgba(0, 0, 0, 0.4)',
        'mac-inset': 'inset 0 1px 2px rgba(255, 255, 255, 0.05)',
      }
    },
  },
  plugins: [],
}
