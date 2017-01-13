// Credit: Code adapted from > https://github.com/joviwap/node-deep-replace

const _ = require('lodash');

module.exports = (obj, replace) => {
	if (_.isObject(obj)) {
		Reflect.ownKeys(obj).forEach(key => {
			obj[key] = module.exports(obj[key], replace);
		});
	} else if (_.isArray(obj)) {
		for (let i = 0; i < obj.length; i += 1) {
			obj[i] = module.exports(obj[i], replace);
		}
	} else if (_.isString(obj)) {
		obj = replace(obj);
	}

	return obj;
};
