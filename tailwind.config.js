/** @type {import('tailwindcss').Config} */
const { text } = require('stream/consumers');
const plugin = require('tailwindcss/plugin');

module.exports = {
  plugins: [
    plugin(function({ addBase }) {
     addBase({
        'html': { fontSize: "20px", fontFamily: 'SequelSans, sans-serif'},
        'h1': { fontSize: "3.815rem" },
        'h2': { fontSize: "3.052rem" },
        'h3': { fontSize: "2.441rem" },
        'h4': { fontSize: "1.953rem" },
        'h5': { fontSize: "1.563rem" },
        'h6': { fontSize: "1.25rem" },
        'p': { fontSize: "1.953rem", },
        'ml': { fontSize: "0.8rem", textTransform: 'lowercase' }, 
        'small': { fontSize: "1.15rem" },
        'price': { fontSize: "1.15rem" },
        'bold': { 
          fontFamily: 'BoldBold, sans-serif',
          wordSpacing: '-0.2em',
          textTransform: 'uppercase',
        },
      })
    }),
  ],
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
        sliderEnter: {
          '0%': { transform: 'translateX(10vw)' },
          '100%': { transform: 'translateX(calc(-80% + 100vw)) translateY(-40%)' }
        },
        imgParallax: {
          '0%': { objectPosition: '100% center' },
          '100%': { objectPosition: '0% center' }
        }
      },
      animation: {
        'backspin': 'backspin 3s cubic-bezier(0.3, -0.4, 0, 1.1) 1',
        'ping-slow': 'ping 5s cubic-bezier(0, -5, 0.25, 5) infinite',
        'slider-scroll': 'sliderEnter linear forwards',
        'img-parallax': 'imgParallax linear'
      },
    },
  },
}