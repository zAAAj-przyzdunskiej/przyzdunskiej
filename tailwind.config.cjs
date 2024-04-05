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
			red: colors.red,
			green: colors.green,
			blue: colors.blue,
			black: colors.black,
			white: colors.white,
			gray: colors.gray,
			emerald: colors.emerald,
			indigo: colors.indigo,
			yellow: colors.yellow,
		},
		fontFamily: {
			sans: ["Roboto", "sans-serif"],
			body: ["Roboto", "sans-serif"],
			mono: ["ui-monospace", "monospace"],
		},
		minHeight: {
			'141': '484px'
		},
		maxHeight: {
			'133': "532px",
			'134': "536px",
			'135': "540px",
			'136': "544px",
			'137': "548px"
		},
		maxWidth: {
			'1/3': '33%',
			'2/3': '67%',
			'1/5': '20%',
			'4/5': '80%',
			'full': '100%'
		},
		extend: {}
	},

	plugins: []
};

module.exports = config;
