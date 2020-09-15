const {Client, Channel, User, Message} = require('discord.js'),
	   util = require("./util"),
	   CommandoRegistry = require('./registry'),
	   CommandDispatcher = require('./dispatcher');
/**
 * Discord.js Client with a command framework
 * @extends {Client}
 */
class CommandoClient extends Client {
	/**
	 * Options for a CommandoClient
	 * @typedef {ClientOptions} CommandoClientOptions
	 * @property {string} [commandPrefix=!] - Default command prefix
	 * @property {number} [commandEditableDuration=30] - Time in seconds that command messages should be editable
	 * @property {boolean} [nonCommandEditable=true] - Whether messages without commands can be edited to a command
	 * @property {string|string[]|Set<string>} [owner] - ID of the bot owner's Discord user, or multiple IDs
	 * @property {string|string[]|Set<string>} [support] - ID of the bot support's Discord user, or multiple IDs
	 * @property {string} [invite] - Invite URL to the bot's support server
	 */

	/**
	 * @param {CommandoClientOptions} [options] - Options for the client
	 */
	constructor(options = {}) {
		if(typeof options.commandPrefix === 'undefined') options.commandPrefix = '!';
		if(options.commandPrefix === null) options.commandPrefix = '';
		if(typeof options.commandEditableDuration === 'undefined') options.commandEditableDuration = 30;
		if(typeof options.nonCommandEditable === 'undefined') options.nonCommandEditable = true;
		super(options);

		/**
		 * The client's command registry
		 * @type {CommandoRegistry}
		 */
		this.registry = new CommandoRegistry(this);

		/**
		 * The client's command dispatcher
		 * @type {CommandDispatcher}
		 */
		this.dispatcher = new CommandDispatcher(this, this.registry);
		this.util = util
        this.GlobalCmds = []; 
		this.main = false; 
		this.GlobalUsers = [];
		this.getColor = (guild) => guild ? guild.color ? guild.color : this.util.colors.default : this.util.colors.default
	
	
		/**
		 * Internal global command prefix, controlled by the {@link CommandoClient#commandPrefix} getter/setter
		 * @type {?string}
		 * @private
		 */
		this._commandPrefix = null;

		this.say = (message, options = {
			content: null,
			embed: {
			title: "INFO",  
			timestamp: "",  
			description: "",  
			color: util.colors.default,  
			image: "",  
			url: "",
			thumbnail: "", 
			fields: [],  
			author: { name: "", icon_url: "", url: ""},  
			footer: { text: "", icon_url: ""}
		}
		}, ...messageOptions) => {
			let sendObj = {...messageOptions}
			if(options.content) sendObj.content = options.content;
			if(options.embed) sendObj.embed = {
				title: options.embed.title || "",
				description: options.embed.description || "",
				color: options.embed.color || util.colors.default,
				url: options.embed.url || "",
				image: {url: options.embed.image},
				thumbnail: {url: options.embed.thumbnail},
				fields: options.embed.fields,
				author: options.embed.author,
				footer: options.embed.footer,
				timestamp: options.embed.timestamp
			};
			if(!sendObj.content && !sendObj.embed) return null;
			const permcheck = (c = null) => {
				if(!c) return message.send(sendObj).catch(() => null)
				if(c.permissionsFor(c.guild.me).has(["EMBED_LINKS", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS", "READ_MESSAGE_HISTORY"])) return c.send(sendObj).catch(() => null);
				return null;
			}
			if(message instanceof User) return permcheck();
			if(message instanceof Message) return permcheck(message.channel);
			if(message instanceof Channel) return permcheck(message);
			return null;
		}
		// Set up command handling
		const msgErr = (err) => this.emit('error', err);
		this.on('message', message => this.dispatcher.handleMessage(message).catch(msgErr));
		this.on('messageUpdate', (oldMessage, newMessage) => this.dispatcher.handleMessage(newMessage, oldMessage).catch(msgErr));
		if(options.owner && options.support){
			this.once("ready", () => {
				let fetch = (type) => {
					if(options[type] instanceof Array || options[type] instanceof Set){
						for (const id of options[type]){
							this.users.fetch(id).catch((err) => {
								this.emit("warn", `Unable to fetch ${type}: ${id}`);
								this.emit("error", err);
							})
						}
					}else{
						this.users.fetch(options[type]).catch((err) => {
							this.emit("warn", `Unable to fetch ${type}: ${owner}`);
							this.emit("error", err);
						})
					}
				};
				fetch("owner");
				fetch("support");
			})
		}
	}

	/**
	 * Global command prefix. An empty string indicates that there is no default prefix, and only mentions will be used.
	 * Setting to `null` means that the default prefix from {@link CommandoClient#options} will be used instead.
	 * @type {string}
	 */
	get commandPrefix() {
		if(typeof this._commandPrefix === 'undefined' || this._commandPrefix === null) return this.options.commandPrefix;
		return this._commandPrefix;
	}

	set commandPrefix(prefix) {
		this._commandPrefix = prefix;
	}

	/**
	 * Owners of the bot, set by the {@link CommandoClientOptions#owner} option
	 * <info>If you simply need to check if a user is an owner of the bot, please instead use
	 * {@link CommandoClient#isOwner}.</info>
	 * @type {?Array<User>}
	 * @readonly
	 */
	get owners() {
		if(!this.options.owner) return null;
		if(typeof this.options.owner === 'string') return [this.users.cache.get(this.options.owner)];
		const owners = [];
		for(const owner of this.options.owner) owners.push(this.users.cache.get(owner));
		return owners;
	}
	/**
	 * Support-users for the bot, set by the {@link CommandoClientOptions#support} option
	 * <info> If you simply need to check if a user is an support-user of the bot, please instead use
	 * {@link CommandoClient#isSupport}</info>
	 * @type {?Array<User>}
	 * @readonly
	 */
	get support(){
		if(!this.options.support) return null;
		if(!Array.isArray(this.options.support)) return [];
		let support = [];
		for(const sup of this.options.support) support.push(this.users.cache.get(sup));
		return support;
	};
	/**
	 * Checks whether a user is an owner of the bot (in {@link CommandoClientOptions#owner})
	 * @param {UserResolvable} user - User to check for ownership
	 * @returns {boolean}
	 */
	isOwner(user) {
		if(!this.options.owner) return false;
		user = this.users.resolve(user);
		if(!user) throw new RangeError('Unable to resolve user.');
		if(typeof this.options.owner === 'string') return user.id === this.options.owner;
		if(this.options.owner instanceof Array) return this.options.owner.includes(user.id);
		if(this.options.owner instanceof Set) return this.options.owner.has(user.id);
		throw new RangeError('The client\'s "owner" option is an unknown value.');
	}
	/**
	 * Checks whether a user is an support-user of the bot (in {@link CommandoClientOptions#support})
	 * @param {UserResolvable} user - User to check.
	 * @returns {boolean}
	 */

	isSupport(user){
		if(!this.options.support) return false;
		user = this.users.resolve(user);
		if(!user) throw new RangeError(`[isSupport] - Unable to resolve user.`);
		if(this.options.support instanceof Array) return this.options.support.includes(user.id);
		if(this.options.support instanceof Set) return this.options.support.has(user.id);
		if(typeof this.options.support === "string") return user.id === this.options.support;
		if(this.options.support instanceof Array) return this.options.support.includes(user.id);
		return false;	
	};
	getPrefix(guild){
		return guild ? guild.commandPrefix : this.commandPrefix;
	}
	async destroy() {
		await super.destroy();
	}
}

module.exports = CommandoClient;
