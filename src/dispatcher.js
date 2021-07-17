class CommandDispatcher {

	constructor(client, registry) {
		
		this.client = client;

		this.registry = registry;

		this.inhibitors = new Set();

		this._commandPatterns = {};

		this._results = new Map();

		this._awaiting = new Set();
	}

	addInhibitor(inhibitor) {
		if(typeof inhibitor !== 'function') throw new TypeError('The inhibitor must be a function.');
		if(this.inhibitors.has(inhibitor)) return false;
		this.inhibitors.add(inhibitor);
		return true;
	}

	removeInhibitor(inhibitor) {
		if(typeof inhibitor !== 'function') throw new TypeError('The inhibitor must be a function.');
		return this.inhibitors.delete(inhibitor);
	}

	async handleMessage(message, oldMessage) {
		if(!this.shouldHandleMessage(message, oldMessage)) return;
		let cmdMsg, oldCmdMsg;
		if(oldMessage) {
			oldCmdMsg = this._results.get(oldMessage.id);
			if(!oldCmdMsg && !this.client.options.nonCommandEditable) return;
			cmdMsg = this.parseMessage(message);
			if(cmdMsg && oldCmdMsg) {
				cmdMsg.responses = oldCmdMsg.responses;
				cmdMsg.responsePositions = oldCmdMsg.responsePositions;
			}
		} else cmdMsg = this.parseMessage(message);

		// Run the command, or reply with an error
		let responses;
		if(cmdMsg) {
			const inhibited = await this.inhibit(cmdMsg);
			if(!inhibited) {
				if(cmdMsg.command) {
					if(!cmdMsg.command.isEnabledIn(message.guild)) {
						responses = await cmdMsg.channel.send({ embeds: [ {title: `Command (${cmdMsg.command.name}) is disabled!`, color: global.util.colors.purple, author: {name: message.guild.name, icon_url: message.guild.iconURL()}} ] })
						.then(msg => setTimeout(() => [ msg, cmdMsg ].map(c => c.del().catch(() => null)), 10000))
						.catch((e) => global.log(`[${global.__filename}|SEND]: Error`, e));
					} else if(!oldMessage || typeof oldCmdMsg !== 'undefined') {
						responses = await cmdMsg.run();
						if(typeof responses === 'undefined') responses = null;
						if(Array.isArray(responses)) responses = await Promise.all(responses);
					}
				}
			} else responses = await inhibited.response;
			cmdMsg.finalize(responses);
		} else if(oldCmdMsg) {
			oldCmdMsg.finalize(null);
			if(!this.client.options.nonCommandEditable) this._results.delete(message.id);
		}

		this.cacheCommandoMessage(message, oldMessage, cmdMsg, responses);
	}

	shouldHandleMessage(message, oldMessage) {
		if(message.partial || message.author.bot) return false;
		if(this._awaiting.has(message.author.id + message.channel.id)) return false;
		if(oldMessage && message.content === oldMessage.content) return false;
		return true;
	}

	async inhibit(cmdMsg) {
		for await (const inhibitor of this.inhibitors) {
			let inhibit = await inhibitor(cmdMsg);
			if(inhibit) {
				if(typeof inhibit !== 'object') inhibit = { reason: inhibit, response: undefined };

				const valid = typeof inhibit.reason === 'string' && (
					typeof inhibit.response === 'undefined' ||
					inhibit.response === null ||
					inhibit.response instanceof Promise
				);
				if(!valid) throw new TypeError(`Inhibitor "${inhibitor.name}" had an invalid result; must be a string or an Inhibition object.`);
				return inhibit;
			}
		}
		return null;
	}

	cacheCommandoMessage(message, oldMessage, cmdMsg, responses) {
		if(this.client.options.commandEditableDuration <= 0) return;
		if(!cmdMsg && !this.client.options.nonCommandEditable) return;
		if(responses !== null) {
			this._results.set(message.id, cmdMsg);
			if(!oldMessage) setTimeout(() => { this._results.delete(message.id); }, this.client.options.commandEditableDuration * 1000);
		} else this._results.delete(message.id);
	}

	parseMessage(message) {
		let content = message.content.replace(new RegExp(/”|“/, "gi"), '"')
		for(const command of this.registry.commands.values()) {
			if(!command.patterns) continue;
			for(const pattern of command.patterns) {
				const matches = pattern.exec(content);
				if(matches) return message.initCommand(command, null, matches);
			}
		}
		let prefix = message.guild ? message.guild.commandPrefix : this.client.commandPrefix,
			extra = this.client.user.id !== "455166272339181589" && this.client.user.username.toLowerCase() === "elara" ? " 2" : ""

		if(!message.guild?.members?.cache?.has?.("455166272339181589")) extra = ""
		for (const pre of [
			`hey ${this.client.user.username}${extra}`,
			`hey ${this.client.user.username}${extra},`,
			`${this.client.user.username}${extra},` 
		]) {
			if(content?.toLowerCase()?.startsWith(pre.toLowerCase())) prefix = pre.toLowerCase();
		}
		if(!this._commandPatterns[prefix]) this.buildCommandPattern(prefix);
		let cmdMsg = this.matchDefault(message, this._commandPatterns[prefix], 2);
		if(!cmdMsg && !message.guild) cmdMsg = this.matchDefault(message, /^([^\s]+)/i, 1, true);
		return cmdMsg;
	}

	matchDefault(message, pattern, commandNameIndex = 1) {
		if(!message.content) return null;
		let content = message.content.replace(new RegExp(/”|“/, "gi"), '"')
		const matches = pattern.exec(content);
		if(!matches) return null;
		const commands = this.registry.findCommands(matches[commandNameIndex], true);
		if(commands.length !== 1 || !commands[0].defaultHandling) return null;
		const argString = content.substring(matches[1].length + (matches[2] ? matches[2].length : 0));
		return message.initCommand(commands[0], argString);
	}

	buildCommandPattern(prefix) {
		let pattern;
		if(prefix) pattern = new RegExp(`^(<@!?${this.client.user.id}>\\s+(?:${prefix.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')}\\s*)?|${prefix.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')}\\s*)([^\\s]+)`, 'i');
		else pattern = new RegExp(`(^<@!?${this.client.user.id}>\\s+)([^\\s]+)`, 'i');
		this._commandPatterns[prefix] = pattern;
		return pattern;
	}
}

module.exports = CommandDispatcher;