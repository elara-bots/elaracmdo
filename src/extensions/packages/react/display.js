const { MessageEmbed } = require('discord.js'),
		ReactionHandler = require('./handler');

class RichDisplay {

	/**
	 * @typedef {Object} RichDisplayEmojisObject
	 * @property {Emoji} first The emoji for the 'first' button
	 * @property {Emoji} back The emoji for the 'back' button
	 * @property {Emoji} forward The emoji for the 'forward' button
	 * @property {Emoji} last The emoji for the 'last' button
	 * @property {Emoji} info The emoji for the 'info' button
	 * @property {Emoji} stop The emoji for the 'stop' button
	 */

	/**
	 * @typedef {Object} RichDisplayRunOptions
	 * @property {Function} [filter] A filter function to add to the ReactionHandler (Receives: Reaction, User)
	 * @property {boolean} [stop=true] If a stop reaction should be included
	 * @property {boolean} [firstLast=true] If a first and last reaction should be included
	 * @property {number} [startPage=0] The page to start the RichDisplay on
	 * @property {number} [max] The maximum total amount of reactions to collect
	 * @property {number} [maxEmojis] The maximum number of emojis to collect
	 * @property {number} [maxUsers] The maximum number of users to react
	 * @property {number} [time] The maximum amount of time before this RichDisplay should expire
	 */

	/**
	 * Constructs our RichDisplay instance
	 * @since 0.4.0
	 * @param {external:MessageEmbed} [embed=new MessageEmbed()] A Template embed to apply to all pages
	 */
	constructor(embed = new MessageEmbed()) {
		/**
		 * The embed template
		 * @since 0.4.0
		 * @type {external:MessageEmbed}
		 */
		this.embedTemplate = embed;

		/**
		 * The stored pages of the display
		 * @since 0.4.0
		 * @type {external:MessageEmbed[]}
		 */
		this.pages = [];

		/**
		 * An optional Info page/embed
		 * @since 0.4.0
		 * @type {?external:MessageEmbed}
		 */
		this.infoPage = null;

		/**
		 * The default emojis to use for this display
		 * @since 0.4.0
		 * @type {RichDisplayEmojisObject}
		 */
		this.emojis = {
			first: '⏪',
			back: '◀',
			forward: '▶',
			last: '⏩',
			info: 'ℹ',
			stop: '🛑' // '⏹'
		};

		/**
		 * If footers have been applied to all pages
		 * @since 0.4.0
		 * @type {boolean}
		 */
		this.footered = false;

		/**
		 * Adds a prefix to all footers (before page/pages)
		 * @since 0.5.0
		 * @type {string}
		 */
		this.footerPrefix = '';
	}

	/**
	 * A new instance of the template embed
	 * @since 0.4.0
	 * @type {external:MessageEmbed}
	 * @readonly
	 */
	get template() {
		return new MessageEmbed(this.embedTemplate);
	}

	/**
	 * Sets a prefix for all footers
	 * @since 0.5.0
	 * @param {string} prefix The prefix you want to add
	 * @returns {this}
	 * @chainable
	 */
	setFooterPrefix(prefix) {
		this.footered = false;
		this.footerPrefix = prefix;
		return this;
	}

	/**
	 * Adds a page to the RichDisplay
	 * @since 0.4.0
	 * @param {(Function|external:MessageEmbed)} embed A callback with the embed template passed and the embed returned, or an embed
	 * @returns {this}
	 * @chainable
	 */
	addPage(embed) {
		this.pages.push(this._handlePageGeneration(embed));
		return this;
	}

	/**
	 * Runs the RichDisplay
	 * @since 0.4.0
	 * @param {import("elaracmdo").CommandoMessage} message A message to either edit, or use to send a new message for this RichDisplay
	 * @param {RichDisplayRunOptions} [options={}] The options to use while running this RichDisplay
	 * @returns {ReactionHandler}
	 */
	async run(message, options = {}) {
		if (!this.footered) this._footer();
		if (!options.filter) options.filter = () => true;
		const emojis = this._determineEmojis(
			[],
			!('stop' in options) || ('stop' in options && options.stop),
			!('firstLast' in options) || ('firstLast' in options && options.firstLast),
		);
		const waitmsg = message.editable ? await message.edit({
			embeds: [
				{
					author: {
						name: message.client.user.tag,
						icon_url: message.client.user.displayAvatarURL({dynamic: true}),
						url: message.client.options.invite
					},
					title: `INFO`,
					description: `One moment please, loading the menu.`,
					color: message.client.getColor(message.guild)
				}
			]
		}).catch(() => null) : await message.boop({embed: {
			author: {
				name: message.client.user.tag,
				icon_url: message.client.user.displayAvatarURL({dynamic: true}),
				url: message.client.options.invite
			},
			title: `INFO`,
			description: `One moment please, loading the menu.`,
			color: message.client.getColor(message.guild)
		}});
		if(!waitmsg) return message.error(`I was unable to post or edit the loading menu message.`);
		for await (const emoji of emojis.filter(m => !m.deleted)) await waitmsg.react(emoji).catch(() => {});
		setTimeout(async () => {
			const msg = waitmsg.editable ? await waitmsg.edit({ embeds: [ this.pages[options.startPage || 0] ] }) : await message.channel.send({ embeds: [ this.pages[options.startPage || 0] ] }).catch(() => null);
			return new ReactionHandler(msg, (r, u) => emojis.includes(r.emoji.name) && !u.bot && options.filter(r, u), options, this, emojis);
		}, 2000 + message.client.options.restTimeOffset)
	}

	/**
	 * Adds page of pages footers to all pages
	 * @since 0.4.0
	 * @returns {void}
	 * @private
	 */
	async _footer() {
		for (let i = 1; i <= this.pages.length; i++) this.pages[i - 1].setFooter(`${this.footerPrefix}${i}/${this.pages.length}`);
		if (this.infoPage) this.infoPage.setFooter('ℹ');
	}

	/**
	 * Determines the emojis to use in this display
	 * @since 0.4.0
	 * @param {Emoji[]} emojis An array of emojis to use
	 * @param {boolean} stop Whether the stop emoji should be included
	 * @param {boolean} firstLast Whether the first & last emojis should be included
	 * @returns {Emoji[]}
	 * @private
	 */
	_determineEmojis(emojis, stop, firstLast) {
		if (this.pages.length > 1 || this.infoPage) {
			if (firstLast) emojis.push(this.emojis.first, this.emojis.back, this.emojis.forward, this.emojis.last); else emojis.push(this.emojis.back, this.emojis.forward);
		}
		if (this.infoPage) emojis.push(this.emojis.info);
		if (stop) emojis.push(this.emojis.stop);
		return emojis;
	}

	/**
	 * Resolves the callback or MessageEmbed into a MessageEmbed
	 * @since 0.4.0
	 * @param {(Function|external:MessageEmbed)} cb The callback or embed
	 * @returns {external:MessageEmbed}
	 * @private
	 */
	_handlePageGeneration(cb) {
		if(cb instanceof MessageEmbed) return cb;
		if(typeof cb === "function" && cb(this.template) instanceof MessageEmbed) return cb(this.template);
		throw new Error('Expected a MessageEmbed or Function returning a MessageEmbed');
	}

}

module.exports = RichDisplay;
