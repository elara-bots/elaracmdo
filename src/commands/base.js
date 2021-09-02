const { MessageEmbed } = require('discord.js'),
		ArgumentCollector = require('./collector'),
		CommandCooldown = new Set();

class Command {

	constructor(client, info) {
		this.constructor.validateInfo(client, info);

		this.client = client;

		this.name = info.name;

		this.aliases = info.aliases || [];
		if(typeof info.autoAliases === 'undefined' || info.autoAliases) {
			if(this.name.includes('-') && !this.name.endsWith('-')) this.aliases.push(this.name.replace(/-/g, ''));
			for(const alias of this.aliases) {
				if(alias.includes('-') && !alias.endsWith('-')) this.aliases.push(alias.replace(/-/g, ''));
			}
		}

		this.groupID = info.group;

		this.group = null;

		this.description = info.description || "No Description Set";

		this.format = info.format || null;

		this.details = info.details || null;

		this.examples = info.examples || null;

		this.guildOnly = Boolean(info.guildOnly);

		this.ownerOnly = Boolean(info.ownerOnly);

		this.dmOnly = Boolean(info.dmOnly);

		this.clientPermissions = info.clientPermissions || [];

		this.clientGuildPermissions = info.clientGuildPermissions || [];

		this.userGuildPermissions = info.userGuildPermissions || [];

		this.userPermissions = info.userPermissions || [];

		this.nsfw = Boolean(info.nsfw);

		this.defaultHandling = 'defaultHandling' in info ? info.defaultHandling : true;

		this.throttling = info.throttling || null;

		this.flags = info.flags || [];

		this.argsCollector = info.args && info.args.length ? new ArgumentCollector(client, info.args, info.argsPromptLimit) : null;
		if(this.argsCollector && typeof info.format === 'undefined') {
			this.format = this.argsCollector.args.reduce((prev, arg) => `${prev}${prev ? ' ' : ''}${arg.default !== null ? '[' : '<'}${arg.label}${arg.infinite ? '...' : ''}${arg.default !== null ? ']' : '>'}`, '');
		}

		this.argsType = info.argsType || 'single';

		this.argsCount = info.argsCount || 0;

		this.argsSingleQuotes = 'argsSingleQuotes' in info ? info.argsSingleQuotes : true;

		this.patterns = info.patterns || null;

		this.guarded = Boolean(info.guarded);

		this.hidden = Boolean(info.hidden);

		this._globalEnabled = true;

		this._throttles = new Map();
	}

	hasPermission(message, ownerOverride = true) {
		if(!this.ownerOnly && !this.userPermissions) return true;
		if(ownerOverride && this.client.isOwner(message.author)) return true;
		if(this.ownerOnly && (ownerOverride || !this.client.isOwner(message.author))) return `Command (\`${this.name}\`) can only be used by the bot developer${this.client.owners.length === 1 ? "" : "s"}`;
		if(message.channel.type === 'GUILD_TEXT' && this.userPermissions) {
            let guild_missing = message.member.permissions.missing(this.userGuildPermissions);
            if(guild_missing.length !== 0) return guild_missing.length === 1 ? `Command (\`${this.name}\`) requires you to have \`${global.util.perms[guild_missing[0]]}\` permission in the server.` : `Command (\`${this.name}\`) requires you to have the following permissions in the server\n${guild_missing.map(c => `▫ \`${global.util.perms[c]}\``).join("\n")}`
            const missing = message.channel.permissionsFor(message.author).missing(this.userPermissions);
            if(missing.length > 0) return missing.length === 1 ? `Command (\`${this.name}\`) requires you to have \`${global.util.perms[missing[0]]}\` permission in this channel` : `Command (\`${this.name}\`) requires you to have the following permissions in this channel.\n${missing.map(pm => `▫ \`${global.util.perms[pm]}\``).join("\n")}`
		}
		return true;
	}

	async run(message, args, fromPattern, result) { // eslint-disable-line no-unused-vars, require-await
		throw new Error(`${this.constructor.name} doesn't have a run() method.`);
	}

	onBlock(message, reason, data) {
		if(CommandCooldown.has(message.author.id)) return null;
		CommandCooldown.add(message.author.id)
		setTimeout(() => CommandCooldown.delete(message.author.id), 2000);
		const send = (content, data = []) => {
            if(!message.guild) return message.error(content);
            if(message.channel.permissionsFor(message.client.user).has(global.PERMS.messages.embed)) return message.error(content);
            return message.channel.send({ content: `I need the following permissions for the (\`${this.name}\`) command to work properly.\n\n__Required Permissions__\n${data.length !== 0 ? data.map(c => `▫ \`${global.util.perms[c]}\``).join("\n") : [ global.PERMS.messages.embed ].map(c => `▫ \`${c}\``).join("\n")}` })
			.catch((e) => global.log(`[CMD:ONBLOCK:SEND:${reason}]: Error`, e));
        }
		switch(reason) {
			case 'guildOnly': return send(`Command (\`${this.name}\`) can only be used in servers.`); 
			case 'nsfw': return send(`Command (\`${this.name}\`) can only be used in channels marked as NSFW`);
			case 'permission': return send(`${data.response ? data.response : `Command (\`${this.name}\`) you don't have permission to use.`}`);
			case 'clientPermissions': return message.channel.permissionsFor(message.client.user).has(global.PERMS.messages.embed) ? 
			message.error(data.missing.length === 1 ? `I need ${global.util.perms[data.missing[0]]} permission for (\`${this.name}\`) command to work properly.` : `I need the follow permissions for the (\`${this.name}\`) command to work properly.\n\n__Required Permissions__\n${data.missing.map(p => `▫ \`${global.util.perms[p]}\``).join("\n")}`) : 
			message.channel.send({ content: `${global.util.emojis.nemoji} I need "Embed Links" in this channel, for my messages to show up properly.` }).catch(() => null)
			case 'throttling': return message.custom(`${global.util.emojis.eload} You can't use (\`${this.name}\`) for another ${data.remaining.toFixed(1)} seconds.`);
			case "maintenance": return message.channel.send({
				embeds: [
					{
						author: {
							name: `${message.client.user.tag} Maintenance`,
							icon_url: message.client.user.displayAvatarURL({dynamic: true}),
							url: message.client.options.invite
						},
						color: global.util.colors.purple,
						timestamp: new Date(),
						thumbnail: {url: `https://cdn.discordapp.com/emojis/733729770180706345.png?v=1`},
						description: `The bot is currently under maintenance, while maintenance is enabled no commands can be used.`,
						footer: {
							text: `Requested by: @${message.author.tag}`,
							icon_url: message.author.displayAvatarURL({dynamic: true})
						}
					}
				],
				components: message.client?.f?.button ? [ { type: 1, components: [ global.support(message.client) ] } ] : []
			}).then(m => m.del({ timeout: 10000 }).catch((e) => global.log(`[CMD:ONBLOCK:SEND:${reason}]: Error`, e)));
			case "channel": return message.channel.send({
				reply: { messageReference: message, failIfNotExists: false },
				embeds: [
					new MessageEmbed({
						title: `INFO`,
						author: {name: message.guild.name, icon_url: message.guild.iconURL({dynamic: true}), url: message.client.options.invite},
						color: message.client.getColor(message.guild),
						footer: {text: `This message will be deleted in 10s`, icon_url: `https://cdn.discordapp.com/emojis/733729770180706345.png?v=1`},
						description: `You can't use commands in this channel.\n**Go to <#${message.guild.Commands}> to use commands!**`,
						timestamp: new Date()
					})
				]
			}).then(m => m.del({ timeout: 10000 })).catch((e) => global.log(`[CMD:ONBLOCK:SEND:${reason}]: Error`, e));
			case "GlobalDisable": return send(`Command (\`${this.name}\`) has been disabled by the bot developer(s), join the [support server](${message.client.options.invite})`);
			default: return null;
		}
	}

	onError(err, message) { // eslint-disable-line no-unused-vars
		if(err?.startsWith?.("[bot]: ")) return message.error(err);
		return message.boop({
			embeds: [
				{
					author: { name: message.client.user.tag, icon_url: message.client.user.displayAvatarURL({dynamic: true}), url: message.client.options.invite },
					color: global.util.colors.purple,
					title: `Command (\`${message.command.name}\`) Error`,
					description: `\`\`\`js\n${err}\`\`\``,
					timestamp: new Date(),
					footer: { text: message.client.isSupport(message.author) ? "" : `Note: This has been reported to the bot development team.`, icon_url: message.client.isSupport(message.author) ? "" : `https://cdn.discordapp.com/emojis/733729770180706345.png?v=1` }
				}
			],
			components: [ { type: 1, components: [ global.support(message.client) ] } ]
		})
	}

	throttle(userID) {
		if(!this.throttling || this.client.isOwner(userID) || global.config?.ignore?.cooldown?.includes(userID)) return null;
		let throttle = this._throttles.get(userID);
		if(!throttle) {
			throttle = { start: Date.now(), usages: 0, timeout: setTimeout(() => this._throttles.delete(userID), this.throttling.duration * 1000) };
			this._throttles.set(userID, throttle);
		}

		return throttle;
	}

	setEnabledIn(guild, enabled) {
		if(typeof guild === 'undefined') throw new TypeError('Guild must not be undefined.');
		if(typeof enabled === 'undefined') throw new TypeError('Enabled must not be undefined.');
		if(this.guarded) throw new Error('The command is guarded.');
		if(!guild) {
			this._globalEnabled = enabled;
			return;
		}
		guild = this.client.guilds.resolve(guild);
		guild.setCommandEnabled(this, enabled);
	}

	isEnabledIn(guild, bypassGroup) {
		if(this.guarded) return true;
		if(!guild) return this.group._globalEnabled && this._globalEnabled;
		guild = this.client.guilds.resolve(guild);
		return (bypassGroup || guild.isGroupEnabled(this.group)) && guild.isCommandEnabled(this);
	}

	isUsable(message = null) {
		if(!message) return this._globalEnabled;
		if(this.guildOnly && !message?.guild) return false;
		const hasPermission = this.hasPermission(message);
		return this.isEnabledIn(message.guild) && hasPermission && typeof hasPermission !== 'string';
	}

	usage(argString, prefix = this.client.commandPrefix, user = this.client.user) {
		return this.constructor.usage(`${this.name}${argString ? ` ${argString}` : ''}`, prefix, user);
	}

	static usage(command, prefix = null, user = null) {
		const nbcmd = command.replace(/ /g, '\xa0');
		if(!prefix && !user) return `\`\`${nbcmd}\`\``;

		let prefixPart;
		if(prefix) {
			if(prefix.length > 1 && !prefix.endsWith(' ')) prefix += ' ';
			prefix = prefix.replace(/ /g, '\xa0');
			prefixPart = `\`\`${prefix}${nbcmd}\`\``;
		}

		let mentionPart = user ? `\`\`@${user.username.replace(/ /g, '\xa0')}#${user.discriminator}\xa0${nbcmd}\`\`` : undefined;

		return `${prefixPart || ''}${prefix && user ? ' or ' : ''}${mentionPart || ''}`;
	}

	static validateInfo(client, info) {
		if(!client) throw new Error('A client must be specified.');
		if(typeof info !== 'object') throw new TypeError('Command info must be an Object.');
		if(typeof info.name !== 'string') throw new TypeError('Command name must be a string.');
		if(info.name !== info.name.toLowerCase()) throw new Error('Command name must be lowercase.');
		if(info.aliases && (!Array.isArray(info.aliases) || info.aliases.some(ali => typeof ali !== 'string'))) throw new TypeError('Command aliases must be an Array of strings.');
		if(info.aliases && info.aliases.some(ali => ali !== ali.toLowerCase())) throw new RangeError('Command aliases must be lowercase.');
		if(typeof info.group !== 'string') throw new TypeError('Command group must be a string.');
		if(info.group !== info.group.toLowerCase()) throw new RangeError('Command group must be lowercase.');
		if(typeof info.description !== 'string') throw new TypeError('Command description must be a string.');
		if('format' in info && typeof info.format !== 'string') throw new TypeError('Command format must be a string.');
		if('details' in info && typeof info.details !== 'string') throw new TypeError('Command details must be a string.');
		if(info.flags && !Array.isArray(info.flags)) throw new TypeError("Command flags must be an array.");
		if(info.examples && (!Array.isArray(info.examples) || info.examples.some(ex => typeof ex !== 'string'))) throw new TypeError('Command examples must be an Array of strings.');
		if(info.clientPermissions) {
			if(!Array.isArray(info.clientPermissions)) throw new TypeError('Command clientPermissions must be an Array of permission key strings.');
			for(const perm of info.clientPermissions) {
				if(!global.util.perms[perm] && typeof perm !== "number") throw new RangeError(`Invalid command clientPermission: ${perm}`);
			}
		}
		if(info.clientGuildPermissions) {
			if(!Array.isArray(info.clientGuildPermissions)) throw new TypeError('Command clientGuildPermissions must be an Array of permission key strings.');
			for(const perm of info.clientGuildPermissions) {
				if(!global.util.perms[perm] && typeof perm !== "number") throw new RangeError(`Invalid command clientGuildPermissions: ${perm}`);
			}
		}
		if(info.userGuildPermissions) {
			if(!Array.isArray(info.userGuildPermissions)) throw new TypeError('Command userGuildPermissions must be an Array of permission key strings.');
			for(const perm of info.userGuildPermissions) {
				if(!global.util.perms[perm] && typeof perm !== "number") throw new RangeError(`Invalid command userGuildPermissions: ${perm}`);
			}
		}
		if(info.userPermissions) {
			if(!Array.isArray(info.userPermissions)) throw new TypeError('Command userPermissions must be an Array of permission key strings.');
			for(const perm of info.userPermissions) {
				if(!global.util.perms[perm] && typeof perm !== "number") throw new RangeError(`Invalid command userPermission: ${perm}`);
			}
		}
		if(info.throttling) {
			if(typeof info.throttling !== 'object') throw new TypeError('Command throttling must be an Object.');
			if(info.throttling.usages < 1) throw new RangeError('Command throttling usages must be at least 1.');
			if(info.throttling.duration < 1) throw new RangeError('Command throttling duration must be at least 1.');
		}
		if(info.args && !Array.isArray(info.args)) throw new TypeError('Command args must be an Array.');
		if('argsPromptLimit' in info && typeof info.argsPromptLimit !== 'number') throw new TypeError('Command argsPromptLimit must be a number.');
		if('argsPromptLimit' in info && info.argsPromptLimit < 0) throw new RangeError('Command argsPromptLimit must be at least 0.');
		if(info.argsType && !['single', 'multiple'].includes(info.argsType)) throw new RangeError('Command argsType must be one of "single" or "multiple".');
		if(info.argsType === 'multiple' && info.argsCount && info.argsCount < 2) throw new RangeError('Command argsCount must be at least 2.');
		if(info.patterns && (!Array.isArray(info.patterns) || info.patterns.some(pat => !(pat instanceof RegExp)))) throw new TypeError('Command patterns must be an Array of regular expressions.');
	}
}

module.exports = Command;
