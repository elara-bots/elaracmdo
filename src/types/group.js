const ArgumentType = require('./base'),
	{ Util: { escapeMarkdown } } = require('discord.js');

class GroupArgumentType extends ArgumentType {
	constructor(client) {
		super(client, 'group');
	}

	validate(val) {
		const groups = this.client.registry.findGroups(val);
		if (!groups.length) return false;
		if (groups.length === 1) return true;
		return groups.length <= 15 ?
			`${this.disambiguation(groups.map(grp => escapeMarkdown(grp.name)), 'groups', null)}\n` :
			'Multiple groups found. Please be more specific.';
	}

	parse(val) {
		return this.client.registry.findGroups(val)[0];
	}
}

module.exports = GroupArgumentType;
