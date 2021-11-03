const { ReactionCollector } = require('discord.js');

class ReactionHandler extends ReactionCollector {

	constructor(message, filter, options, display, emojis) {
		super(message, { filter, ...options });
		this.display = display;
		this.methodMap = new Map(Object.entries(this.display.emojis).map(([key, value]) => [value, key]));
		this.currentPage = this.options.startPage || 0;
		this.time = typeof this.options.time === 'number' ? this.options.time : 120000;
		this.awaiting = false;
		this.selection = this.display.emojis.zero ? new Promise((resolve, reject) => {
			this.reject = reject;
			this.resolve = resolve;
		}) : Promise.resolve(null);
		this.reactionsDone = false;
		if (emojis.length) this._queueEmojiReactions(emojis);
		else return this.stop();
		this.on('collect', (reaction, user) => {
			if (user.bot) return null;
			if (this.message.guild && this.message.channel.permissionsFor(this.client.user.id).has(global.PERMS.manage.messages) && !this.message.deleted) reaction.users.remove(user.id).catch(() => null);
			this[this.methodMap.get(reaction.emoji.name)](user);
		});
		setTimeout(() => this.emit("end"), this.time || 120000)
		this.on('end', () => {
			if (this.reactionsDone && !this.message.deleted && this.message.guild) this.message.reactions.removeAll().catch(() => null);
				setTimeout(async () => {
					
			if (!this.message.deleted) this.message.edit({
					embeds: [
						{
							author: {
								name: this.message.guild?.name ?? this.message.author.tag,
								icon_url: this.message.guild?.iconURL?.({dynamic: true}) ?? this.message.author.displayAvatarURL({dynamic: true}),
								url: this.message.client.options.invite
							},
							title: `Menu Closed`,
							color: 0xFF0000,
							timestamp: new Date(),
							footer: {
								text: `This message will be deleted in 20s`,
								icon_url: `${this.client.options.http.cdn}/emojis/${global.util.emojis.rload}.gif`
							}
						}
					]
				})
				.then(() => this.message.del({ timeout: 20000, reason: "Auto" }))
			}, 5000)
		});
}
	first() {
		this.currentPage = 0;
		this.update();
	}

	back() {
		if (this.currentPage <= 0) return;
		this.currentPage--;
		this.update();
	}

	forward() {
		if (this.currentPage > this.display.pages.length - 1) return;
		this.currentPage++;
		this.update();
	}

	last() {
		this.currentPage = this.display.pages.length - 1;
		this.update();
	}

	info() {
		this.message.edit({ embeds: [ this.display.infoPage ] }).catch(() => null);
	}

	stop() {
		if (this.resolve) this.resolve(null);
		super.stop();
	}

	zero() {
		if (this.display.options.length - 1 < this.currentPage * 10) return;
		this.resolve(this.currentPage * 10);
		this.stop();
	}

	one() {
		if (this.display.options.length - 1 < 1 + (this.currentPage * 10)) return;
		this.resolve(1 + (this.currentPage * 10));
		this.stop();
	}

	two() {
		if (this.display.options.length - 1 < 2 + (this.currentPage * 10)) return;
		this.resolve(2 + (this.currentPage * 10));
		this.stop();
	}

	three() {
		if (this.display.options.length - 1 < 3 + (this.currentPage * 10)) return;
		this.resolve(3 + (this.currentPage * 10));
		this.stop();
	}

	four() {
		if (this.display.options.length - 1 < 4 + (this.currentPage * 10)) return;
		this.resolve(4 + (this.currentPage * 10));
		this.stop();
	}

	five() {
		if (this.display.options.length - 1 < 5 + (this.currentPage * 10)) return;
		this.resolve(5 + (this.currentPage * 10));
		this.stop();
	}

	six() {
		if (this.display.options.length - 1 < 6 + (this.currentPage * 10)) return;
		this.resolve(6 + (this.currentPage * 10));
		this.stop();
	}

	seven() {
		if (this.display.options.length - 1 < 7 + (this.currentPage * 10)) return;
		this.resolve(7 + (this.currentPage * 10));
		this.stop();
	}

	eight() {
		if (this.display.options.length - 1 < 8 + (this.currentPage * 10)) return;
		this.resolve(8 + (this.currentPage * 10));
		this.stop();
	}

	nine() {
		if (this.display.options.length - 1 < 9 + (this.currentPage * 10)) return;
		this.resolve(9 + (this.currentPage * 10));
		this.stop();
	}

	update() {
		if (!this.message.deleted) this.message.edit({ embeds: [ this.display.pages[this.currentPage] ] }).catch(() => null);
	}

	async _queueEmojiReactions(emojis) {
		if (this.message.deleted) return this.stop();
		if (this.ended) return this.message.reactions.removeAll().catch(() => null);
		for (const e of emojis) {
			if (!this.message.deleted) this.message.react(e).catch(() => null);
		}
		this.reactionsDone = true;
		return null;
	}

}

module.exports = ReactionHandler;
