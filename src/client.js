const { Client, Collection, SnowflakeUtil, Util: { resolveColor } } = require('discord.js'),
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

	/**
    * Get previous messages in a channel
	* @arg {import("discord.js").TextChannel} [channel]
    * @arg {Number} [limit=50] The max number of messages to get
    * @arg {String} [before] Get messages before this message ID
    * @arg {String} [after] Get messages after this message ID
    * @arg {String} [around] Get messages around this message ID (does not work with limit > 100)
    * @returns {Promise<Array<import("elaracmdo").CommandoMessage>>}
    */
    async fetchMessages(channel, limit = 50, before, after, around) {
		this.emit("special:debug", `[CLIENT:fetchMessages]: Fetching ${limit} messages from ${channel.name} (${channel.id})`);
        if (limit && limit > 100) {
            let logs = [];
            const get = async (_before, _after) => {
                const messages = [...(await channel.messages.fetch({ limit: 100, before: _before || undefined, after: _after || undefined }).catch(() => new Collection())).values()];
                if (limit <= messages.length) {
                    return (_after ? messages.slice(messages.length - limit, messages.length).map((message) => message).concat(logs) : logs.concat(messages.slice(0, limit).map((message) => message)));
                }
                limit -= messages.length;
                logs = (_after ? messages.map((message) => message).concat(logs) : logs.concat(messages.map((message) => message)));
                if (messages.length < 100)  return logs;
                return get((_before || !_after) && messages[messages.length - 1].id, _after && messages[0].id);
            };
            return get(before, after);
        }
        return [ ...(await channel.messages.fetch({ limit, before, after, around }).catch(() => new Collection())).values() ];
    }

	async deleteMessages(channel, messageIDs) {
		if (messageIDs.length <= 0) throw new Error(`[CLIENT:deleteMessages]: No messages provided!`);
		messageIDs = messageIDs.filter(id => Date.now() - SnowflakeUtil.deconstruct(id).timestamp < 1209600000)
		this.emit("special:debug", `[CLIENT:deleteMessages]: Deleting ${messageIDs.length} messages from ${channel.name} (${channel.id})`);
		if (messageIDs.length <= 100) {
			await channel.bulkDelete(messageIDs, true).catch(() => new Collection());
			return messageIDs;
		}
		let [ chunks, i ] = [
			this.chunk(messageIDs, 100),
			0
		];
		for (const chunk of chunks) {
			i++;
			setTimeout(() => channel.bulkDelete(chunk, true).catch(() => new Collection()), i * 2000);
		}
		return messageIDs;
	}

	async purgeChannel(channelID, limit, filter, before, after) {
		let channel = this.channels.resolve(channelID)
		if (!channel) return 0;
        if (typeof filter === "string") filter = (msg) => msg.content.includes(filter);
        if (limit !== -1 && limit <= 0) return 0;
		this.emit("special:debug", `[CLIENT:purgeChannel]: Running the purge in ${channel.name} (${channel.id})`);
        let [ toDelete, deleted, done ] = [ [], 0, false ];
        const checkToDelete = async () => {
            const messageIDs = (done && toDelete) || (toDelete.length >= 100 && toDelete.splice(0, 100));
            if (messageIDs) {
                deleted += messageIDs.length;
                await this.deleteMessages(channel, messageIDs);
                if (done) return deleted;
                await sleep(1000);
                return checkToDelete();
            }else 
			if (done) {
                return deleted;
            }else {
                await sleep(250);
                return checkToDelete();
            }
        };
        const del = async (_before, _after) => {
            const messages = await this.fetchMessages(channel, 100, _before, _after);
            if (limit !== -1 && limit <= 0) {
                done = true;
                return;
            }
            for(const message of messages) {
                if (limit !== -1 && limit <= 0) {
                    break;
                }
                if (message.timestamp < Date.now() - 1209600000) { // 14d * 24h * 60m * 60s * 1000ms
                    done = true;
                    return;
                }
                if (!filter || filter(message)) toDelete.push(message.id);
                if (limit !== -1) limit--;
            }
            if ((limit !== -1 && limit <= 0) || messages.length < 100) {
                done = true;
                return;
            }
            await del((_before || !_after) && messages[messages.length - 1].id, _after && messages[0].id);
        };
        await del(before, after);
        return checkToDelete();
    }
}