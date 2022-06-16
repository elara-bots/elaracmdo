const ArgumentType = require('./base'),
	{ Util: { escapeMarkdown } } = require('discord.js'),
	nameFilterExact = (s) => t => t.name.toLowerCase() === s,
	nameFilterInexact = (s) => t => t.name.toLowerCase().includes(s);

module.exports = class RoleArgumentType extends ArgumentType {
	constructor(client) {
		super(client, 'role');
	}

	validate(val, msg, arg) {
		const matches = val.match(/^(?:<@&)?([0-9]+)>?$/);
		if (matches) return msg.guild.roles.cache.has(matches[1]);
		const search = val.toLowerCase();
		let roles = msg.guild.roles.cache.filter(nameFilterInexact(search));
		if (!roles.size) return false;
		if (roles.size === 1) {
			if (arg.oneOf && !arg.oneOf.includes(roles.first().id)) return false;
			return true;
		}
		const exactRoles = roles.filter(nameFilterExact(search));
		if (exactRoles.size === 1) {
			if (arg.oneOf && !arg.oneOf.includes(exactRoles.first().id)) return false;
			return true;
		}
		if (exactRoles.size > 0) roles = exactRoles;
		return roles.size <= 15 ?
			`${this.disambiguation(roles.map(role => `${escapeMarkdown(role.name)}`), 'roles', null)}\n` :
			'Multiple roles found. Please be more specific.';
	}

	parse(val, msg) {
		const matches = val.match(/^(?:<@&)?([0-9]+)>?$/);
		if (matches) return msg.guild.roles.resolve(matches[1]) || null;
		const search = val.toLowerCase();
		const roles = msg.guild.roles.cache.filter(nameFilterInexact(search));
		if (!roles.size) return null;
		if (roles.size === 1) return roles.first();
		const exactRoles = roles.filter(nameFilterExact(search));
		if (exactRoles.size === 1) return exactRoles.first();
		return null;
	}
}