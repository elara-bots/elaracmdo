/* eslint-disable no-unused-vars */
module.exports = class ArgumentType {

	constructor(client, id) {
		if (!client) throw new Error('A client must be specified.');
		if (typeof id !== 'string') throw new Error('Argument type ID must be a string.');
		if (id !== id.toLowerCase()) throw new Error('Argument type ID must be lowercase.');
	
		this.client = client;
		this.id = id;
	}

	validate(val, msg, arg) { 
		throw new Error(`${this.constructor.name} doesn't have a validate() method.`);
	}

	parse(val, msg, arg) { 
		throw new Error(`${this.constructor.name} doesn't have a parse() method.`);
	}

	isEmpty(val, msg, arg) { 
		if (Array.isArray(val)) return val.length === 0;
		return !val;
	}
	disambiguation(items, label, property = "name") {
		return `Multiple ${label} found, please be more specific: ${items.map(item => `"${(property ? item[property] : item).replace(/ /g, '\xa0')}"`).join(', ')}`
	}
}