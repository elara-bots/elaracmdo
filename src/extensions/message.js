const { Structures, escapeMarkdown, splitMessage, resolveString, MessageEmbed } = require('discord.js');
const { oneLine } = require('common-tags');
const Command = require('../commands/base');
const FriendlyError = require('../errors/friendly');
const CommandFormatError = require('../errors/command-format');
const functions = {
	blacklist: (message) => {
		if(message.client.isOwner(message.author.id)) return false;
		if(message?.client?.GlobalUsers?.includes(message.author.id)) return true;
		if(!message.guild) return false;
		if(message.client?.config?.ignore?.guilds?.includes(message.guild?.id)) return true;
		return false;
	}
}

module.exports = Structures.extend('Message', Message => {
	/**
	 * An extension of the base Discord.js Message class to add command-related functionality.
	 * @extends Message
	 */
	class CommandoMessage extends Message {
		constructor(client, data, channel) {
			super(client, data, channel);
			/**
			 * Whether the message contains a command (even an unknown one)
			 * @type {boolean}
			 */
			this.isCommand = false;

			/**
			 * Command that the message triggers, if any
			 * @type {?Command}
			 */
			this.command = null;

			/**
			 * Argument string for the command
			 * @type {?string}
			 */
			this.argString = null;

			/**
			 * Pattern matches (if from a pattern trigger)
			 * @type {?string[]}
			 */
			this.patternMatches = null;

			/**
			 * Response messages sent, mapped by channel ID (set by the dispatcher after running the command)
			 * @type {?Object}
			 */
			this.responses = null;

			/**
			 * Index of the current response that will be edited, mapped by channel ID
			 * @type {?Object}
			 */
			this.responsePositions = null;
		}

		/**
		 * Initialises the message for a command
	 	 * @param {Command} [command] - Command the message triggers
	 	 * @param {string} [argString] - Argument string for the command
	 	 * @param {?Array<string>} [patternMatches] - Command pattern matches (if from a pattern trigger)
		 * @return {Message} This message
		 * @private
		 */
		initCommand(command, argString, patternMatches) {
			this.isCommand = true;
			this.command = command;
			this.argString = argString;
			this.patternMatches = patternMatches;
			return this;
    	}
    	/**
     	* @param {Object} [options]
		* @param {number} [options.timeout=0] - The time to wait before deleting the message.
		* @param {string} [options.reason=""] - The reason for deleting the message. 
     	*/
	 	del(options = {timeout: 0, reason: ""}){
        	if(this.deleted) return Promise.resolve(`The message was deleted.`);
		if (typeof options !== 'object') options = {timeout: 0, reason: ""};	    
    		const { timeout = 0, reason } = options;
        	if (timeout <= 0) {	
                   return this.channel.messages.delete(this.id, reason).then(() => this);	
        	} else {	
            	   return new Promise(resolve => {	
                	this.client.setTimeout(() => {	
                  		if(this.deleted) return resolve(`The message was already deleted.`); 
                  		resolve(this.del({ reason }));	
                	}, timeout);	
            	   });	
       		}
		}
		/**
		 * Creates a usage string for the message's command
		 * @param {string} [argString] - A string of arguments for the command
		 * @param {string} [prefix=this.guild.commandPrefix || this.client.commandPrefix] - Prefix to use for the
		 * prefixed command format
		 * @param {User} [user=this.client.user] - User to use for the mention command format
		 * @return {string}
		 */
		usage(argString, prefix, user = this.client.user) {
			if(typeof prefix === 'undefined') {
				if(this.guild) prefix = this.guild.commandPrefix;
				else prefix = this.client.commandPrefix;
			}
			return this.command.usage(argString, prefix, user);
		}

		/**
		 * Creates a usage string for any command
		 * @param {string} [command] - A command + arg string
		 * @param {string} [prefix=this.guild.commandPrefix || this.client.commandPrefix] - Prefix to use for the
		 * prefixed command format
		 * @param {User} [user=this.client.user] - User to use for the mention command format
		 * @return {string}
		 */
		anyUsage(command, prefix, user = this.client.user) {
			if(typeof prefix === 'undefined') {
				if(this.guild) prefix = this.guild.commandPrefix;
				else prefix = this.client.commandPrefix;
			}
			return Command.usage(command, prefix, user);
		}

		/**
		 * Parses the argString into usable arguments, based on the argsType and argsCount of the command
		 * @return {string|string[]}
		 * @see {@link Command#run}
		 */
		parseArgs() {
			switch(this.command.argsType) {
				case 'single': return this.argString.trim().replace(this.command.argsSingleQuotes ? /^("|')([^]*)\1$/g : /^(")([^]*)"$/g, '$2');
				case 'multiple': return this.constructor.parseArgs(this.argString, this.command.argsCount, this.command.argsSingleQuotes);
				default: throw new RangeError(`Unknown argsType "${this.argsType}".`);
			}
		}

		/**
		 * Runs the command
		 * @return {Promise<?Message|?Array<Message>>}
		 */
		async run() { // eslint-disable-line complexity
			if(!this.author) return this.command.onBlock(this, `no_author`);
			if(this.author.bot || this.webhookID) return this.command.onBlock(this, "bot_or_webhook");
			let [ owner, support ] = [ this.client.isOwner(this.author.id), this.client.isSupport(this.author.id) ];
			
			if(this.client.main && !support) return this.command.onBlock(this, "maintenance");
			if(functions.blacklist(this) && !support) return this.command.onBlock(this, "blacklist");
			if(this.client.GlobalCmds?.includes(this.command.name) && !owner) return this.command.onBlock(this, "GlobalDisable");
			
			if(this.guild) {
				if(!this.member) return this.command.onBlock(this, "no_member");
				if(this.client.config?.ignore?.guilds?.includes(this.guild.id) && !support) return this.command.onBlock(this, "guild_ignored");
				if(!this.guild.members.cache.has(this.author.id)) return this.command.onBlock(this, "member_not_cached");
				if(this.command.dmOnly) return this.command.onBlock(this, "dmOnly");
				if(this.guild.commands && (this.guild.commands !== this.channel.id) && !this.member.permissions.has("MANAGE_MESSAGES") && !owner) return this.command.onBlock(this, "channel");
			}else {
				if(this.command.guildOnly) return this.command.onBlock(this, "guildOnly");
				if(this.command.nsfw && !this.channel.nsfw) return this.command.onBlock(this, "nsfw");
			}
			/**
			 * @returns {Promise<boolean>}
			 */
			const checkPerms = () => {
				return new Promise(async (_, rej) => {
					if(!this.member) return _(false);
					if(this.member.roles.cache.filter(c => c.id !== this.guild.id).size === 0) return _(false);
					if(!this.client || !this.client.user) return _(false);
					if(!this.client.dbs || !this.client.dbs.getSettings) return _(false);
					if(this.command.ownerOnly && !this.client.isOwner(this.author.id)) return _(false);
					if(this.client.isOwner(this.author.id)) return _(false);
                	let db = await this.client.dbs.getSettings(this.guild);
                	if(!db) return _(false);
                	if(!db.commands || !Array.isArray(db.commands)) return _(false);
                	let find = db.commands.find(c => c.name === this.command.name);
                	if(!find) return _(false);
                	if(this.member.roles.cache.filter(c => find.roles?.includes(c)).size !== 0) return _(true);
                	return _(false); 
				})
            };
			// Ensure the user has permission to use the command
			const hasPermission = this.command.hasPermission(this);
			if(!hasPermission || typeof hasPermission === 'string') {
				let perm = false;
				if(this.guild && this.member) perm = await checkPerms();
				if(!perm) {
					const data = { response: typeof hasPermission === 'string' ? hasPermission : undefined };
					return this.command.onBlock(this, 'permission', data);
				}
			}

			// Ensure the client user has the required permissions
			if(this.guild) {
				if(this.command.clientPermissions) {
					const missing = this.channel.permissionsFor(this.client.user).missing(this.command.clientPermissions);
					if(missing.length > 0) return this.command.onBlock(this, 'clientPermissions', { missing });
				};
				if(this.command.clientGuildPermissions) {
					const missing = this.guild.me.permissions.missing(this.command.clientGuildPermissions);
					if(missing.length !== 0) return this.command.onBlock(this, 'clientPermissions', { missing });
				};
			};

			// Throttle the command
			const throttle = this.command.throttle(this.author.id);
			if(throttle && ((throttle.usages + 1) > this.command.throttling.usages)) {
				const remaining = (throttle.start + (this.command.throttling.duration * 1000) - Date.now()) / 1000;
				const data = { throttle, remaining };
				return this.command.onBlock(this, 'throttling', data);
			}

			// Figure out the command arguments
			let args = this.patternMatches;
			let collResult = null;
			if(!args && this.command.argsCollector) {
				const collArgs = this.command.argsCollector.args;
				const count = collArgs[collArgs.length - 1].infinite ? Infinity : collArgs.length;
				const provided = this.constructor.parseArgs(this.argString.trim(), count, this.command.argsSingleQuotes);

				collResult = await this.command.argsCollector.obtain(this, provided);
				if(collResult.cancelled) {
					if(collResult.prompts.length === 0) return this.reply(new CommandFormatError(this).message);
					if(this.guild && this.client.dbs && this.client.dbs.getSettings){
						let db = await this.client.dbs.getSettings(this.guild);
						if(db && db.toggles.prompts && collResult.prompts.length !== 0 && collResult.answers.length !== 0) {
							let candelete = this.channel.permissionsFor(this.guild.me).has("MANAGE_MESSAGES") || false;
							let IDS = [...collResult.prompts.filter(c => !c.deleted).map(c => c.id)];
							if(candelete) IDS.push(...collResult.answers.filter(c => !c.deleted).map(c => c.id))
							this.channel.bulkDelete(IDS, true).catch(() => {});
						}
					}
					return this.error(`Command Cancelled`);
				}
				if(this.guild && this.client.dbs && this.client.dbs.getSettings){
				let db = await this.client.dbs.getSettings(this.guild);
				if(db && db.toggles.prompts && collResult.prompts.length !== 0 && collResult.answers.length !== 0) {
					let candelete = this.channel.permissionsFor(this.guild.me).has("MANAGE_MESSAGES") || false;
					let IDS = [...collResult.prompts.filter(c => !c.deleted).map(c => c.id)];
					if(candelete) IDS.push(...collResult.answers.filter(c => !c.deleted).map(c => c.id))
						this.channel.bulkDelete(IDS, true).catch(() => {});
					}
				}
				args = collResult.values;
			}
			if(!args) args = this.parseArgs();
			const fromPattern = Boolean(this.patternMatches);

			// Run the command
			if(throttle) throttle.usages++;
			const typingCount = this.channel.typingCount;
			try {
				const promise = this.command.run(this, args, fromPattern, collResult);
				/**
				 * Emitted when running a command
				 * @event CommandoClient#commandRun
				 * @param {Command} command - Command that is being run
				 * @param {Promise} promise - Promise for the command result
				 * @param {CommandoMessage} message - Command message that the command is running from (see {@link Command#run})
				 * @param {Object|string|string[]} args - Arguments for the command (see {@link Command#run})
				 * @param {boolean} fromPattern - Whether the args are pattern matches (see {@link Command#run})
				 * @param {?ArgumentCollectorResult} result - Result from obtaining the arguments from the collector
				 * (if applicable - see {@link Command#run})
				 */
				this.client.emit('commandRun', this.command, promise, this, args, fromPattern, collResult);
				const retVal = await promise;
				if(!(retVal instanceof Message || retVal instanceof Array || retVal === null || retVal === undefined)) {
					throw new TypeError( oneLine`
						Command ${this.command.name}'s run() resolved with an unknown type
						(${retVal !== null ? retVal && retVal.constructor ? retVal.constructor.name : (typeof retVal) : null}).
						Command run methods must return a Promise that resolve with a Message, Array of Messages, or null/undefined.`);
				}
				return retVal;
			} catch(err) {
				/**
				 * Emitted when a command produces an error while running
				 * @event CommandoClient#commandError
				 * @param {Command} command - Command that produced an error
				 * @param {Error} err - Error that was thrown
				 * @param {CommandoMessage} message - Command message that the command is running from (see {@link Command#run})
				 * @param {Object|string|string[]} args - Arguments for the command (see {@link Command#run})
				 * @param {boolean} fromPattern - Whether the args are pattern matches (see {@link Command#run})
				 * @param {?ArgumentCollectorResult} result - Result from obtaining the arguments from the collector
				 * (if applicable - see {@link Command#run})
				 */
				this.client.emit('commandError', this.command, err, this, args, fromPattern, collResult);
				if(this.channel.typingCount > typingCount) this.channel.stopTyping();
				if(err instanceof FriendlyError) return this.reply(err.message);
				return this.command.onError(err, this, args, fromPattern, collResult);
			}
		}
		/**
		 * Responds to the command message
		 * @param {Object} [options] - Options for the response
		 * @return {Message|Message[]}
		 * @private
		 */
		respond({ type = 'reply', content, options, lang, fromEdit = false }) {
			const shouldEdit = this.responses && !fromEdit;
			if(shouldEdit) {
				if(options && options.split && typeof options.split !== 'object') options.split = {};
			}

			if(type === 'reply' && this.channel.type === 'dm') type = 'plain';
			if(type !== 'direct' && this.guild && !this.channel.permissionsFor(this.client.user).has("SEND_MESSAGES")) type = "direct";

			content = resolveString(content);
			content = content.replace(new RegExp(this.client.token, "g"), "[Fuck Off]")
			switch(type) {
				case 'plain':
					if(!shouldEdit) return this.channel.send(content, options);
					return this.editCurrentResponse(this.channel.type === "dm" ? "dm" : this.channel.id, { type, content, options });
				case 'reply':
					if(!shouldEdit) return super.reply(content, options);
					if(options && options.split && !options.split.prepend) options.split.prepend = `${this.author}, `;
					return this.editCurrentResponse(this.channel.type === "dm" ? "dm" : this.channel.id, { type, content, options });
				case 'direct':
					if(!shouldEdit) return this.author.send(content, options);
					return this.editCurrentResponse('dm', { type, content, options });
				case 'code':
					if(!shouldEdit) return this.channel.send(content, options);
					if(options && options.split) {
						if(!options.split.prepend) options.split.prepend = `\`\`\`${lang || ''}\n`;
						if(!options.split.append) options.split.append = '\n```';
					}
					content = `\`\`\`${lang || ''}\n${escapeMarkdown(content, true)}\n\`\`\``;
					return this.editCurrentResponse(this.channel.type === "dm" ? "dm" : this.channel.id, { type, content, options });
				default:
					throw new RangeError(`Unknown response type "${type}".`);
			}
		}

		/**
		 * Edits a response to the command message
		 * @param {Message|Message[]} response - The response message(s) to edit
		 * @param {Object} [options] - Options for the response
		 * @return {Promise<Message|Message[]>}
		 * @private
		 */
		editResponse(response, { type, content, options }) {
			if(!response) return this.respond({ type, content, options, fromEdit: true });
			if(options && options.split) content = splitMessage(content, options.split);

			let prepend = '';
			if(type === 'reply') prepend = `${this.author}, `;

			if(content instanceof Array) {
				const promises = [];
				if(response instanceof Array) {
					for(let i = 0; i < content.length; i++) {
						if(response.length > i) promises.push(response[i].edit(`${prepend}${content[i]}`, options));
						else promises.push(response[0].channel.send(`${prepend}${content[i]}`));
					}
				} else {
					promises.push(response.edit(`${prepend}${content[0]}`, options));
					for(let i = 1; i < content.length; i++) {
						promises.push(response.channel.send(`${prepend}${content[i]}`));
					}
				}
				return Promise.all(promises);
			} else {
				if(response instanceof Array) { // eslint-disable-line no-lonely-if
					for(let i = response.length - 1; i > 0; i--) response[i].del();
					return response[0].edit(`${prepend}${content}`, options);
				} else {
					return response.edit(`${prepend}${content}`, options);
				}
			}
		}

		/**
		 * @description Makes the bot start typing in the channel that the command is used in.
		 * @returns {boolean}
		 */
		typing(){
			this.channel.startTyping(true);
			setTimeout(() => this.channel.stopTyping(true), 5000);
			return true;
		}

		/**
		 * Edits the current response
		 * @param {string} id - The ID of the channel the response is in ("DM" for direct messages)
		 * @param {Object} [options] - Options for the response
		 * @return {Promise<Message|Message[]>}
		 * @private
		 */
		editCurrentResponse(id, options) {
			if(typeof this.responses[id] === 'undefined') this.responses[id] = [];
			if(typeof this.responsePositions[id] === 'undefined') this.responsePositions[id] = -1;
			this.responsePositions[id]++;
			return this.editResponse(this.responses[id][this.responsePositions[id]], options);
		}

		/**
		 * Responds with a plain message
		 * @param {StringResolvable} content - Content for the message
		 * @param {MessageOptions} [options] - Options for the message
		 * @return {Promise<Message|Message[]>}
		 */
		say(content, options) {
			if(!options && typeof content === 'object' && !(content instanceof Array)) {
				options = content;
				content = '';
			}
			return this.respond({ type: 'plain', content, options });
		}

		/**
		 * Responds with a reply message
		 * @param {StringResolvable} content - Content for the message
		 * @param {MessageOptions} [options] - Options for the message
		 * @return {Promise<Message|Message[]>}
		 */
		reply(content, options) {
			if(!options && typeof content === 'object' && !(content instanceof Array)) {
				options = content;
				content = '';
			};
			return this.inlineReply(content, options);
		}

		/**
		 * Responds with a direct message
		 * @param {StringResolvable} content - Content for the message
		 * @param {MessageOptions} [options] - Options for the message
		 * @return {Promise<Message|Message[]>}
		 */
		direct(content, options) {
			if(!options && typeof content === 'object' && !(content instanceof Array)) {
				options = content;
				content = '';
			}
			return this.respond({ type: 'direct', content, options });
		}
		success(content, text, options){ return this.custom(`${this.client.util.emojis.semoji} ${content}`, text, options); };
		error(content, text, options){ return this.custom(`${this.client.util.emojis.nemoji} ${content}`, text, options); };
		/**
		 * Responds with an embed
		 * @param {MessageEmbed|Object} [embed] - Embed to send
		 * @param {StringResolvable} [content] - Content for the message
		 * @param {MessageOptions} [options] - Options for the message
		 * @return {Promise<Message|Message[]>}
		 */
		embed(embed, content = '', options) {
			if(typeof options !== 'object') options = {};
			options.embed = embed;
			return this.respond({ type: 'plain', content, options });
		}
		/**
		 * @param {string} [content] - The content for the embed.
		 * @param {string|import("discord.js").MessageOptions} [text] - The content for the message.
		 * @param {import('discord.js').MessageOptions|string} [options] - The options for the message
		 * @returns {Promise<Message|Message[]>}
		 */

		custom(content, text, options){
			if(text === null) text = undefined;
			if(typeof text === "object") { options = text; text = undefined; };
			if(typeof options === "string") { options = {}; text = options; }
			return this.inlineReply(text || undefined, {
				embed: {
					title: `INFO`,
					description: content, 
					color: this.client.getColor(this.guild),
					timestamp: new Date(),
					author: { name: this.author.tag, icon_url: this.author.displayAvatarURL({dynamic: true}), url: this.client.options.invite }
				},
				...options,
				reply: true
			})
		};
		/** 
		 * @param {import("elaracmdo").SayOptions} options 
		 * @param  {import("discord.js").MessageOptions} messageOptions 
		 */
		boop(options = {}, ...messageOptions){
			let sendObj = {...messageOptions}
			if(options.content) sendObj.content = options.content;

			if(options.embed) {
				if(options.embed?.image && typeof options.embed?.image === "string") options.embed.image = { url: options.embed.image };
				if(options.embed?.thumbnail && typeof options.embed?.thumbnail === "string") options.embed.thumbnail = { url: options.embed.thumbnail };
				sendObj.embed = new MessageEmbed(options.embed).toJSON();
			}
			if(!sendObj.content && !sendObj.embed) return null;
			if(this.channel.type !== "dm" && !this.channel.permissionsFor(this.client.user).has(["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS", "EMBED_LINKS"])) return null;
			return this.inlineReply(sendObj.content ?? "", {...sendObj, reply: true});
		}

		/**
		 * Finalizes the command message by setting the responses and deleting any remaining prior ones
		 * @param {?Array<Message|Message[]>} responses - Responses to the message
		 * @private
		 */
		finalize(responses) {
			if(this.responses) this.deleteRemainingResponses();
			this.responses = {};
			this.responsePositions = {};

			if(responses instanceof Array) {
				for(const response of responses) {
					const channel = (response instanceof Array ? response[0] : response).channel;
					const id = channel.type === "dm" ? "dm" : channel.id;
					if(!this.responses[id]) {
						this.responses[id] = [];
						this.responsePositions[id] = -1;
					}
					this.responses[id].push(response);
				}
			} else if(responses) {
				const id = responses.channel ? responses.channel.type === "dm" ? "dm" : responses.channel.id : "dm"
				this.responses[id] = [responses];
				this.responsePositions[id] = -1;
			}
		}

		/**
		 * Deletes any prior responses that haven't been updated
		 * @private
		 */
		deleteRemainingResponses() {
			for(const id of Object.keys(this.responses)) {
				const responses = this.responses[id];
				for(let i = this.responsePositions[id] + 1; i < responses.length; i++) {
					const response = responses[i];
					if(response instanceof Array) {
						for(const resp of response) resp.del();
					} else {
						response.del();
					}
				}
			}
		}

		/**
		 * Parses an argument string into an array of arguments
		 * @param {string} argString - The argument string to parse
		 * @param {number} [argCount] - The number of arguments to extract from the string
		 * @param {boolean} [allowSingleQuote=true] - Whether or not single quotes should be allowed to wrap arguments,
		 * in addition to double quotes
		 * @return {string[]} The array of arguments
		 */
		static parseArgs(argString, argCount, allowSingleQuote = true) {
			const re = allowSingleQuote ? /\s*(?:("|')([^]*?)\1|(\S+))\s*/g : /\s*(?:(")([^]*?)"|(\S+))\s*/g;
			const result = [];
			let match = [];
			// Large enough to get all items
			argCount = argCount || argString.length;
			// Get match and push the capture group that is not null to the result
			while(--argCount && (match = re.exec(argString))) result.push(match[2] || match[3]);
			// If text remains, push it to the array as-is (except for wrapping quotes, which are removed)
			if(match && re.lastIndex < argString.length) {
				const re2 = allowSingleQuote ? /^("|')([^]*)\1$/g : /^(")([^]*)"$/g;
				result.push(argString.substr(re.lastIndex).replace(re2, '$2'));
			}
			return result;
		};
		/**
		 * Responds with a reply message
		 * @param {StringResolvable} content - Content for the message
		 * @param {MessageOptions} [options] - Options for the message
		 * @return {Promise<Message|Message[]>}
		 */
		inlineReply(content, options) {
			if(!options && typeof content === 'object' && !(content instanceof Array)) {
				options = content;
				content = '';
			};
			if(typeof options !== "object") options = { };
			let message_reference = { message_id: this.id, fail_if_not_exists: false };
			if(options?.reply === true) options.allowedMentions = { ...options.allowedMentions, replied_user: false };
			delete options["reply"];
			let { data } = require("discord.js").APIMessage.create(this, content, options).resolveData();
			if(typeof data.allowed_mentions === "undefined" && options.allowedMentions) data.allowed_mentions = options.allowedMentions;
			return this.client.api.channels(this.channel.id).messages.post({ data: { ...data, message_reference } })
			.then(r => new (CommandoMessage)(this.client, r, this.channel))
			.catch(err => err);
		};
	}

	return CommandoMessage;
});
