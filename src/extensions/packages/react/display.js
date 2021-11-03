const { MessageEmbed } = require('discord.js'),
		ReactionHandler = require('./handler');

class RichDisplay {

	constructor(embed = new MessageEmbed()) {

		this.embedTemplate = embed;
		this.pages = [];
		this.infoPage = null;
		this.emojis = {
			first: '⏪',
			back: '◀',
			forward: '▶',
			last: '⏩',
			info: 'ℹ',
			stop: '🛑' // '⏹'
		};
		this.footered = false;
		this.footerPrefix = '';
	}

	get template() {
		return new MessageEmbed(this.embedTemplate);
	}

	setFooterPrefix(prefix) {
		this.footered = false;
		this.footerPrefix = prefix;
		return this;
	}

	addPage(embed) {
		this.pages.push(this._handlePageGeneration(embed));
		return this;
	}

	async run(message, options = {}) {
		if (!this.footered) this._footer();
		if (!options.filter) options.filter = () => true;
		let slash = Boolean(options.isSlash);
		const emojis = this._determineEmojis(
			[],
			!('stop' in options) || ('stop' in options && options.stop),
			!('firstLast' in options) || ('firstLast' in options && options.firstLast),
		);
		const embeds = [
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
		const waitmsg = message.editable ? await message.edit({ embeds, components: slash ? [] : undefined }).catch(() => null) : await message.boop({ embeds, components: slash ? [] : undefined });
		if (!waitmsg) return message.error(`I was unable to post or edit the loading menu message.`);
		for await (const emoji of emojis.filter(m => !m.deleted)) await waitmsg.react(emoji).catch(() => {});
		setTimeout(async () => {
			const msg = waitmsg.editable ? await waitmsg.edit({ embeds: [ this.pages[options.startPage || 0] ], components: slash ? [] : undefined }) : await message.channel.send({ embeds: [ this.pages[options.startPage || 0] ], components: slash ? [] : undefined }).catch(() => null);
			return new ReactionHandler(msg, (r, u) => emojis.includes(r.emoji.name) && !u.bot && options.filter(r, u), options, this, emojis);
		}, 2000 + message.client.options.restTimeOffset)
	}

	async _footer() {
		for (let i = 1; i <= this.pages.length; i++) this.pages[i - 1].setFooter(`${this.footerPrefix}${i}/${this.pages.length}`);
		if (this.infoPage) this.infoPage.setFooter('ℹ');
	}

	_determineEmojis(emojis, stop, firstLast) {
		if (this.pages.length > 1 || this.infoPage) {
			if (firstLast) emojis.push(this.emojis.first, this.emojis.back, this.emojis.forward, this.emojis.last); else emojis.push(this.emojis.back, this.emojis.forward);
		}
		if (this.infoPage) emojis.push(this.emojis.info);
		if (stop) emojis.push(this.emojis.stop);
		return emojis;
	}

	_handlePageGeneration(cb) {
		if (cb instanceof MessageEmbed) return cb;
		if (typeof cb === "function" && cb(this.template) instanceof MessageEmbed) return cb(this.template);
		throw new Error('Expected a MessageEmbed or Function returning a MessageEmbed');
	}

}

module.exports = RichDisplay;