/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx,vue,css}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'light-noise': 'url("/img/bg_noise.png")', 
      },
      fontFamily: {
        BoldBold: ['BoldBold', 'sans-serif'],
        SequelSans: ['SequelSans', 'sans-serif'],
      },
      colors: {
        cement: '#ebecf0',
        yellow: '#ffff3e',
        jeans: '#006791',
        lightBlack: '#181716',
        black: '#000000',
        silver: '#96a2a5',
      },
      keyframes: {
        backspin: {
          '100%': { transform: 'rotate(0deg)' },
          '0%': { transform: 'rotate(-1440deg)' },
        },
        toycar: {
          '0%': { transform: 'translateX(0px) scale(1)', opacity: 1 },
          '10%': { transform: 'translateX(-20px) scale(0.95)', opacity: 1 },
          '20%': { transform: 'translateX(0px) scale(1)', opacity: 1 },
          '30%': { transform: 'translateX(50px) scale(1.05)', opacity: 0 },
          '80%': { transform: 'translateX(90%) scale(1.5)', opacity: 0 },
          '90%': { transform: 'translateX(-100%) scale(1)', opacity: 0 },
          '100%': { transform: 'translateX(-200%) scale(1)', opacity: 0 },
        },
        toyCarBrake: {
          '0%': { transform: 'translateX(0px)' },
          '50%': { transform: 'translateX(5px)' },
          '100%': { transform: 'translateX(0px)' },
        },
      },
      animation: {
        'backspin': 'backspin 3s cubic-bezier(0.3, -0.4, 0, 1.1) 1',
        'ping-slow': 'ping 5s cubic-bezier(0, -5, 0.25, 5) infinite',
        'toycar': 'toycar 1s ease-in-out forwards',
      },
    },
  },
}