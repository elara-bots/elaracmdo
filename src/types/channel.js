const ArgumentType = require('./base'),
	{ Util: { escapeMarkdown } } = require('discord.js'),
	nameFilterExact = (s) => t => t.name.toLowerCase() === s,
	nameFilterInexact = (s) => t => t.name.toLowerCase().includes(s);

module.exports = class ChannelArgumentType extends ArgumentType {
	constructor(client) {
		super(client, 'channel');
	}

	validate(val, msg, arg) {
		const matches = val.match(/^(?:<#)?([0-9]+)>?$/);
		if (matches) return msg.guild.channels.cache.has(matches[1]);
		const search = val.toLowerCase();
		let channels = msg.guild.channels.cache.filter(nameFilterInexact(search));
		if (!channels.size) return false;
		if (channels.size === 1) {
			if (arg.oneOf && !arg.oneOf.includes(channels.first().id)) return false;
			return true;
		}
		const exactChannels = channels.filter(nameFilterExact(search));
		if (exactChannels.size === 1) {
			if (arg.oneOf && !arg.oneOf.includes(exactChannels.first().id)) return false;
			return true;
		}
		if (exactChannels.size > 0) channels = exactChannels;
		return channels.size <= 15 ?
			`${this.disambiguation(channels.map(chan => escapeMarkdown(chan.name)), 'channels', null)}\n` :
			'Multiple channels found. Please be more specific.';
	}

	parse(val, msg) {
		const matches = val.match(/^(?:<#)?([0-9]+)>?$/);
		if (matches) return msg.guild.channels.resolve(matches[1]) || null;
		const search = val.toLowerCase();
		const channels = msg.guild.channels.cache.filter(nameFilterInexact(search));
		if (!channels.size) return null;
		if (channels.size === 1) return channels.first();
		const exactChannels = channels.filter(nameFilterExact(search));
		if (exactChannels.size === 1) return exactChannels.first();
		return null;
	}
}