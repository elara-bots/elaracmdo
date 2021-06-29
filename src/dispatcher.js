const { escapeRegex } = require('./util');

/** Handles parsing messages and running commands from them */
class CommandDispatcher {
	/**
	 * @param {CommandoClient} client - Client the dispatcher is for
	 * @param {CommandoRegistry} registry - Registry the dispatcher will use
	 */
	constructor(client, registry) {
		/**
		 * Client this dispatcher handles messages for
		 * @name CommandDispatcher#client
		 * @type {CommandoClient}
		 * @readonly
		 */
		Object.defineProperty(this, 'client', { value: client });

		/**
		 * Registry this dispatcher uses
		 * @type {CommandoRegistry}
		 */
		this.registry = registry;

		/**
		 * Functions that can block commands from running
		 * @type {Set<Function>}
		 */
		this.inhibitors = new Set();

		/**
		 * Map object of {@link RegExp}s that match command messages, mapped by string prefix
		 * @type {Object}
		 * @private
		 */
		this._commandPatterns = {};

		/**
		 * Old command message results, mapped by original message ID
		 * @type {Map<string, CommandoMessage>}
		 * @private
		 */
		this._results = new Map();

		/**
		 * Tuples in string form of user ID and channel ID that are currently awaiting messages from a user in a channel
		 * @type {Set<string>}
		 * @private
		 */
		this._awaiting = new Set();
	}

	/**
	 * @typedef {Object} Inhibition
	 * @property {string} reason - Identifier for the reason the command is being blocked
	 * @property {?Promise<Message>} - Response being sent to the user
	 */

	/**
	 * A function that decides whether the usage of a command should be blocked
	 * @callback Inhibitor
	 * @param {CommandoMessage} msg - Message triggering the command
	 * @return {boolean|string|Inhibition} `false` if the command should *not* be blocked.
	 * If the command *should* be blocked, then one of the following:
	 * - A single string identifying the reason the command is blocked
	 * - An Inhibition object
	 */

	/**
	 * Adds an inhibitor
	 * @param {Inhibitor} inhibitor - The inhibitor function to add
	 * @return {boolean} Whether the addition was successful
	 * @example
	 * client.dispatcher.addInhibitor(msg => {
	 *   if(blacklistedUsers.has(msg.author.id)) return 'blacklisted';
	 * });
	 * @example
	 * client.dispatcher.addInhibitor(msg => {
	 * 	if(!coolUsers.has(msg.author.id)) return ['cool', msg.reply('You\'re not cool enough!')];
	 * });
	 */
	addInhibitor(inhibitor) {
		if(typeof inhibitor !== 'function') throw new TypeError('The inhibitor must be a function.');
		if(this.inhibitors.has(inhibitor)) return false;
		this.inhibitors.add(inhibitor);
		return true;
	}

	/**
	 * Removes an inhibitor
	 * @param {Inhibitor} inhibitor - The inhibitor function to remove
	 * @return {boolean} Whether the removal was successful
	 */
	removeInhibitor(inhibitor) {
		if(typeof inhibitor !== 'function') throw new TypeError('The inhibitor must be a function.');
		return this.inhibitors.delete(inhibitor);
	}

	/**
	 * Handle a new message or a message update
	 * @param {Message} message - The message to handle
	 * @param {Message} [oldMessage] - The old message before the update
	 * @return {Promise<void>}
	 * @private
	 */
	async handleMessage(message, oldMessage) {
		/* eslint-disable max-depth */
		if(!this.shouldHandleMessage(message, oldMessage)) return;

		// Parse the message, and get the old result if it exists
		let cmdMsg, oldCmdMsg;
		if(oldMessage) {
			oldCmdMsg = this._results.get(oldMessage.id);
			if(!oldCmdMsg && !this.client.options.nonCommandEditable) return;
			cmdMsg = this.parseMessage(message);
			if(cmdMsg && oldCmdMsg) {
				cmdMsg.responses = oldCmdMsg.responses;
				cmdMsg.responsePositions = oldCmdMsg.responsePositions;
			}
		} else {
			cmdMsg = this.parseMessage(message);
		}

		// Run the command, or reply with an error
		let responses;
		if(cmdMsg) {
			const inhibited = await this.inhibit(cmdMsg);
			if(!inhibited) {
				if(cmdMsg.command) {
					if(!cmdMsg.command.isEnabledIn(message.guild)) {
						responses = await cmdMsg.channel.send({ embeds: [ {title: `Command (${cmdMsg.command.name}) is disabled!`, color: 0x36393E, author: {name: message.guild.name, icon_url: message.guild.iconURL()}} ] })
						.then(msg => setTimeout(() => {msg.del().catch(() => {}); cmdMsg.del().catch(() => {})}, 10000))
						.catch((e) => global.log(`[${__filename}|SEND]: Error`, e));
					} else if(!oldMessage || typeof oldCmdMsg !== 'undefined') {
						responses = await cmdMsg.run();
						if(typeof responses === 'undefined') responses = null;
						if(Array.isArray(responses)) responses = await Promise.all(responses);
					}
				} else {
					
				}
			} else {
				responses = await inhibited.response;
			}

			cmdMsg.finalize(responses);
		} else if(oldCmdMsg) {
			oldCmdMsg.finalize(null);
			if(!this.client.options.nonCommandEditable) this._results.delete(message.id);
		}

		this.cacheCommandoMessage(message, oldMessage, cmdMsg, responses);
		/* eslint-enable max-depth */
	}

	/**
	 * Check whether a message should be handled
	 * @param {Message} message - The message to handle
	 * @param {Message} [oldMessage] - The old message before the update
	 * @return {boolean}
	 * @private
	 */
	shouldHandleMessage(message, oldMessage) {
		if(message.partial) return false;
		if(message.author.bot) return false;
		if(this._awaiting.has(message.author.id + message.channel.id)) return false;
		if(oldMessage && message.content === oldMessage.content) return false;
		return true;
	}

	/**
	 * Inhibits a command message
	 * @param {CommandoMessage} cmdMsg - Command message to inhibit
	 * @return {Promise<?Inhibition>}
	 * @private
	 */
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
				if(!valid) {
					throw new TypeError(`Inhibitor "${inhibitor.name}" had an invalid result; must be a string or an Inhibition object.`);
				}
				return inhibit;
			}
		}
		return null;
	}

	/**
	 * Caches a command message to be editable
	 * @param {Message} message - Triggering message
	 * @param {Message} oldMessage - Triggering message's old version
	 * @param {CommandoMessage} cmdMsg - Command message to cache
	 * @param {Message|Message[]} responses - Responses to the message
	 * @private
	 */
	cacheCommandoMessage(message, oldMessage, cmdMsg, responses) {
		if(this.client.options.commandEditableDuration <= 0) return;
		if(!cmdMsg && !this.client.options.nonCommandEditable) return;
		if(responses !== null) {
			this._results.set(message.id, cmdMsg);
			if(!oldMessage) {
				setTimeout(() => { this._results.delete(message.id); }, this.client.options.commandEditableDuration * 1000);
			}
		} else {
			this._results.delete(message.id);
		}
	}

	/**
	 * Parses a message to find details about command usage in it
	 * @param {Message} message - The message
	 * @return {?CommandoMessage}
	 * @private
	 */
	parseMessage(message) {
		let content = message.content.replace(new RegExp(/”|“/, "gi"), '"')
		// Find the command to run by patterns
		for(const command of this.registry.commands.values()) {
			if(!command.patterns) continue;
			for(const pattern of command.patterns) {
				const matches = pattern.exec(content);
				if(matches) return message.initCommand(command, null, matches);
			}
		}
		// Find the command to run with default command handling
		let prefix = message.guild ? message.guild.commandPrefix : this.client.commandPrefix,
			extra = this.client.user.id !== "455166272339181589" && this.client.user.username.toLowerCase() === "elara" ? " 2" : ""

		if(!message.guild?.members?.cache?.has?.("455166272339181589")) extra = ""
		for (const pre of [
			`hey ${this.client.user.username}${extra}`,
			`hey ${this.client.user.username}${extra},`,
			`${this.client.user.username}${extra},` 
		]) {
			if(content?.toLowerCase()?.startsWith(pre.toLowerCase())) prefix = pre.toLowerCase();
		};
		if(!this._commandPatterns[prefix]) this.buildCommandPattern(prefix);
		let cmdMsg = this.matchDefault(message, this._commandPatterns[prefix], 2);
		if(!cmdMsg && !message.guild) cmdMsg = this.matchDefault(message, /^([^\s]+)/i, 1, true);
		return cmdMsg;
	}

	/**
	 * Matches a message against a guild command pattern
	 * @param {Message} message - The message
	 * @param {RegExp} pattern - The pattern to match against
	 * @param {number} commandNameIndex - The index of the command name in the pattern matches
	 * @return {?CommandoMessage}
	 * @private
	 */
	matchDefault(message, pattern, commandNameIndex = 1) {
		let content = message.content.replace(new RegExp(/”|“/, "gi"), '"')
		const matches = pattern.exec(content);
		if(!matches) return null;
		const commands = this.registry.findCommands(matches[commandNameIndex], true);
		if(commands.length !== 1 || !commands[0].defaultHandling) return null;
		const argString = content.substring(matches[1].length + (matches[2] ? matches[2].length : 0));
		return message.initCommand(commands[0], argString);
	}

	/**
	 * Creates a regular expression to match the command prefix and name in a message
	 * @param {?string} prefix - Prefix to build the pattern for
	 * @return {RegExp}
	 * @private
	 */
	buildCommandPattern(prefix) {
		let pattern;
		if(prefix) {
			const escapedPrefix = escapeRegex(prefix);
			pattern = new RegExp(`^(<@!?${this.client.user.id}>\\s+(?:${escapedPrefix}\\s*)?|${escapedPrefix}\\s*)([^\\s]+)`, 'i');
		} else {
			pattern = new RegExp(`(^<@!?${this.client.user.id}>\\s+)([^\\s]+)`, 'i');
		}
		this._commandPatterns[prefix] = pattern;
		return pattern;
	}
}

module.exports = CommandDispatcher;
