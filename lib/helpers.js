const chars = (n, char) => {
	let str = '';

	for (let i = 0; i < n; i += 1) {
		str += char;
	}

	return str;
};

module.exports = {
	chars
};
