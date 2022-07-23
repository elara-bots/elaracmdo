const { Client, Collection, SnowflakeUtil } = require('discord.js'),
		CommandoRegistry = require('./registry'),
		CommandDispatcher = require('./dispatcher'),
		sleep = (ms) => new Promise((res) => setTimeout(res, ms));

module.exports = class CommandoClient extends Client {
	constructor(options = {}) {
		if (!options.commandPrefix) options.commandPrefix = '!';
		if (typeof options.commandEditableDuration === 'undefined') options.commandEditableDuration = 30;
		if (typeof options.nonCommandEditable === 'undefined') options.nonCommandEditable = true;
		if (!Array.isArray(options?.regexPrefix)) options.regexPrefix = [];
		super(options);
		this.registry = new CommandoRegistry(this);
		this.dispatcher = new CommandDispatcher(this);
		this._commandPrefix = null;
		
		this.on('messageCreate', message => this.dispatcher.handleMessage(message).catch((err) => this.emit('error', err)));
		this.on('messageUpdate', (oldMessage, newMessage) => this.dispatcher.handleMessage(newMessage, oldMessage).catch((err) => this.emit('error', err)));

		if (options.owner || options.support){
			this.once("ready", () => {
				let fetch = (types) => {
					for (const type of types) {
						if (options[type] instanceof Array || options[type] instanceof Set){
							for (const id of options[type]){
								this.users.fetch(id)
								.catch((err) => {
									this.emit("warn", `Unable to fetch ${type}: ${id}`);
									this.emit("error", err);
								})
							}
						}else{
							this.users.fetch(options[type])
							.catch((err) => {
								this.emit("warn", `Unable to fetch ${type}: ${options[type]}`);
								this.emit("error", err);
							})
						}
					}
				};
				fetch([ "owner", "support" ]);
			})
		}
	}

	/**
	 * Global command prefix. An empty string indicates that there is no default prefix, and only mentions will be used.
	 * Setting to `null` means that the default prefix from {@link CommandoClient#options} will be used instead.
	 * @type {string}
	 */
	get commandPrefix() {
		if (typeof this._commandPrefix === 'undefined' || this._commandPrefix === null) return this.options.commandPrefix;
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
		if (!this.options.owner) return null;
		if (typeof this.options.owner === 'string') return [this.users.resolve(this.options.owner)];
		const owners = [];
		for(const owner of this.options.owner) owners.push(this.users.resolve(owner));
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
		if (!this.options.support) return null;
		if (!Array.isArray(this.options.support)) return [];
		let support = [];
		for(const sup of this.options.support) support.push(this.users.resolve(sup));
		return support;
	}

	/**
	 * Checks whether a user is an owner of the bot (in {@link CommandoClientOptions#owner})
	 * @param {UserResolvable} user - User to check for ownership
	 * @returns {boolean}
	 */
	isOwner(user) {
		try{
			if (!this.options.owner) return false;
			user = this.users.resolve(user);
			if (!user) throw new RangeError('Unable to resolve user.');
			if (typeof this.options.owner === 'string') return user.id === this.options.owner;
			if (this.options.owner instanceof Array) return this.options.owner.includes(user.id);
			if (this.options.owner instanceof Set) return this.options.owner.has(user.id);
			throw new RangeError('The client\'s "owner" option is an unknown value.');
		}catch(err){
			return false;
		}
	}
	/**
	 * Checks whether a user is an support-user of the bot (in {@link CommandoClientOptions#support})
	 * @param {UserResolvable} user - User to check.
	 * @returns {boolean}
	 */

	isSupport(user){
		try{
			if (!this.options.support) return false;
			user = this.users.resolve(user);
			if (!user) throw new RangeError(`[isSupport] - Unable to resolve user.`);
			if (this.options.support instanceof Array) return this.options.support.includes(user.id);
			if (this.options.support instanceof Set) return this.options.support.has(user.id);
			if (typeof this.options.support === "string") return user.id === this.options.support;
			return false;	
		}catch(err){
			return false;
		}
	}

	chunk(s = [], c = 10) {
		let R = [];
		for (var i = 0; i < s.length; i += c) R.push(s.slice(i, i + c));
		return R;
	}

	getPrefix(guild){ return guild?.commandPrefix ?? this.commandPrefix; }
	async destroy() { await super.destroy(); }
}