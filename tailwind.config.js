module.exports = {
    content: ["./layouts/**/*.{html,js}", "./content/**/*.md"],
    theme: {
	container: {
	    center: true
	}
    },
    plugins: [
	require("@tailwindcss/forms")({
	    strategy: "class",
	}),
    ]
};
