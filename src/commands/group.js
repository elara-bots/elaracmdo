const { Collection } = require('discord.js');

class CommandGroup {

	constructor(client, id, name, guarded = false) {
		if(!client) throw new Error('A client must be specified.');
		if(typeof id !== 'string') throw new TypeError('Group ID must be a string.');
		if(id !== id.toLowerCase()) id = id.toLowerCase();

		this.client = client;

		this.id = id;

		this.name = name || id;

		this.commands = new Collection();

		this.guarded = guarded;

		this._globalEnabled = true;
	}

	setEnabledIn(guild, enabled) {
		if(typeof guild === 'undefined') throw new TypeError('Guild must not be undefined.');
		if(typeof enabled === 'undefined') throw new TypeError('Enabled must not be undefined.');
		if(this.guarded) throw new Error('The group is guarded.');
		if(!guild) {
			this._globalEnabled = enabled;
			return;
		}
		guild = this.client.guilds.resolve(guild);
		guild.setGroupEnabled(this, enabled);
	}

	isEnabledIn(guild) {
		if(this.guarded) return true;
		if(!guild) return this._globalEnabled;
		guild = this.client.guilds.resolve(guild);
		return guild.isGroupEnabled(this);
	}
}

module.exports = CommandGroup;
