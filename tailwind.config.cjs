const colors = require('tailwindcss/colors')
/** @type {import('tailwindcss').Config}*/
const config = {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		colors: {
			primary: '#007FEC',
			primaryLight: '#00B1FD',
			secondaryLight: '#71FACA',
			transparent: 'transparent',
			current: 'currentColor',
			black: colors.black,
			white: colors.white,
			gray: colors.gray,
			emerald: colors.emerald,
			indigo: colors.indigo,
			yellow: colors.yellow,
			
		},
		extend: {}
	},

	plugins: []
};

module.exports = config;
