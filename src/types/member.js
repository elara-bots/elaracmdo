const ArgumentType = require('./base'),
	{ Util: { escapeMarkdown } } = require('discord.js');

class MemberArgumentType extends ArgumentType {
	constructor(client) {
		super(client, 'member');
	}

	async validate(val, msg, arg) {
		const matches = val.match(/^(?:<@!?)?([0-9]+)>?$/);
		if (matches) {
			try {
				const member = msg.guild.members.cache.get(matches[1]) || await msg.guild.members.fetch({ user: matches[1], cache: true }).catch(() => null);
				if (!member) return false;
				if (arg.oneOf && !arg.oneOf.includes(member.id)) return false;
				return true;
			} catch(err) {
				return false;
			}
		}
		const search = val.toLowerCase();
		let members = msg.guild.members.cache.filter(memberFilterInexact(search));
		if (!members.size) return false;
		if (members.size === 1) {
			if (arg.oneOf && !arg.oneOf.includes(members.first().id)) return false;
			return true;
		}
		const exactMembers = members.filter(memberFilterExact(search));
		if (exactMembers.size === 1) {
			if (arg.oneOf && !arg.oneOf.includes(exactMembers.first().id)) return false;
			return true;
		}
		if (exactMembers.size > 0) members = exactMembers;
		return members.size <= 15 ?
		`${this.disambiguation(members.map(mem => `${escapeMarkdown(mem.user.username)}#${mem.user.discriminator}`), 'members', null)}\n` :
		'Multiple members found. Please be more specific.';
	}

	parse(val, msg) {
		const matches = val.match(/^(?:<@!?)?([0-9]+)>?$/);
		if (matches) return msg.guild.members.resolve(matches[1]) || null;
		const search = val.toLowerCase();
		const members = msg.guild.members.cache.filter(memberFilterInexact(search));
		if (!members.size) return null;
		if (members.size === 1) return members.first();
		const exactMembers = members.filter(memberFilterExact(search));
		if (exactMembers.size === 1) return exactMembers.first();
		return null;
	}
}

function memberFilterExact(search) {
	return mem => mem.user.username.toLowerCase() === search ||
		(mem.nickname && mem.nickname.toLowerCase() === search) ||
		`${mem.user.username.toLowerCase()}#${mem.user.discriminator}` === search;
}

function memberFilterInexact(search) {
	return mem => mem.user.username.toLowerCase().includes(search) ||
		(mem.nickname && mem.nickname.toLowerCase().includes(search)) ||
		`${mem.user.username.toLowerCase()}#${mem.user.discriminator}`.includes(search);
}

module.exports = MemberArgumentType;
