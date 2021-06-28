const ArgumentType = require('./base');
const { disambiguation } = require('../util');
const { escapeMarkdown } = require('discord.js');

class CategoryChannelArgumentType extends ArgumentType {
	constructor(client) {
		super(client, 'category-channel');
	}

	validate(val, msg, arg) {
		const matches = val.match(/^([0-9]+)$/);
		if(matches) {
			try {
				const channel = msg.guild.channels.resolve(matches[1]);
				if(!channel || channel.type !== 'category') return false;
				if(arg.oneOf && !arg.oneOf.includes(channel.id)) return false;
				return true;
			} catch(err) {
				return false;
			}
		}
		if(!msg.guild) return false;
		const search = val.toLowerCase();
		let channels = msg.guild.channels.cache.filter(channelFilterInexact(search));
		if(channels.size === 0) return false;
		if(channels.size === 1) {
			if(arg.oneOf && !arg.oneOf.includes(channels.first().id)) return false;
			return true;
		}
		const exactChannels = channels.filter(channelFilterExact(search));
		if(exactChannels.size === 1) {
			if(arg.oneOf && !arg.oneOf.includes(exactChannels.first().id)) return false;
			return true;
		}
		if(exactChannels.size > 0) channels = exactChannels;
		return channels.size <= 15 ?
			`${disambiguation(
				channels.map(chan => escapeMarkdown(chan.name)), 'categories', null
			)}\n` :
			'Multiple categories found. Please be more specific.';
	}

	parse(val, msg) {
		const matches = val.match(/^([0-9]+)$/);
		if(matches) return msg.guild.channels.cache.get(matches[1]) || null;
		if(!msg.guild) return null;
		const search = val.toLowerCase();
		const channels = msg.guild.channels.cache.filter(channelFilterInexact(search));
		if(channels.size === 0) return null;
		if(channels.size === 1) return channels.first();
		const exactChannels = channels.filter(channelFilterExact(search));
		if(exactChannels.size === 1) return exactChannels.first();
		return null;
	}
}

function channelFilterExact(search) {
	return chan => chan.type === 'category' && chan.name.toLowerCase() === search;
}

function channelFilterInexact(search) {
	return chan => chan.type === 'category' && chan.name.toLowerCase().includes(search);
}

module.exports = CategoryChannelArgumentType;
