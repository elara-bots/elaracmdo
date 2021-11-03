const { Util: { escapeMarkdown } } = require('discord.js'),
		ArgumentUnionType = require('../types/union');

class Argument {
	constructor(client, info) {
		this.constructor.validateInfo(client, info);
		this.key = info.key;
		this.label = info.label || info.key;
		this.prompt = info.prompt;
		this.error = info.error || null;
		this.type = this.constructor.determineType(client, info.type);
		this.max = typeof info.max !== 'undefined' ? info.max : null;
		this.min = typeof info.min !== 'undefined' ? info.min : null;
		this.default = typeof info.default !== 'undefined' ? info.default : null;
		this.oneOf = typeof info.oneOf !== 'undefined' ? info.oneOf : null;
		this.infinite = Boolean(info.infinite);
		this.validator = info.validate || null;
		this.parser = info.parse || null;
		this.emptyChecker = info.isEmpty || null;
		this.wait = typeof info.wait !== 'undefined' ? info.wait : 30;
	}

	async obtain(msg, val, promptLimit = Infinity) {
		let empty = this.isEmpty(val, msg);
		if (empty && this.default !== null) return { value: typeof this.default === 'function' ? await this.default(msg, this) : this.default, cancelled: null, prompts: [], answers: [] };
		if (this.infinite) return this.obtainInfinite(msg, val, promptLimit);

		const [ wait, prompts, answers ] = [
			this.wait > 0 && this.wait !== Infinity ? this.wait * 1000 : undefined,
			[], []
		]
		let valid = !empty ? await this.validate(val, msg) : false;

		while(!valid || typeof valid === 'string') {
			if (prompts.length >= promptLimit) return { value: null, cancelled: 'promptLimit', prompts, answers };

			prompts.push(await msg.boop({ embeds: [ {
				author: {
					name: msg.client.user.tag,
					icon_url: msg.client.user.displayAvatarURL({ dynamic: true }),
					url: msg.client.options.invite
				},
				title: `INFO`,
				color: msg.client.getColor(msg.guild),
				description: `${empty ? this.prompt : valid ? valid : `You provided an invalid ${this.label}. Please try again.`}`,
				footer: {
					text: wait ? `This will be automatically be cancelled in ${this.wait} seconds` : '',
					icon_url: wait ? `https://cdn.discordapp.com/emojis/733729770180706345.png?v=1` : ''
				},
				fields: [
					{
						name: `\u200b`,
						value: `Respond with **\`cancel\`** to cancel the command.\n*Don't include the prefix and command name*`
					}
				]
			} ] }));

			const responses = await msg.channel.awaitMessages({ filter: msg2 => msg2.author.id === msg.author.id, max: 1, time: wait });
			if (responses?.size === 1) {
				answers.push(responses.first());
				val = answers[answers.length - 1].content;
			} else return { value: null, cancelled: 'time', prompts, answers };

			if (val.toLowerCase() === 'cancel') return { value: null, cancelled: 'user', prompts, answers };

			empty = this.isEmpty(val, msg);
			valid = await this.validate(val, msg);
		}

		return { value: await this.parse(val, msg), cancelled: null, prompts, answers };
	}

	async obtainInfinite(msg, vals, promptLimit = Infinity) {
		let [ wait, results, prompts, answers, currentVal ] = [
			this.wait > 0 && this.wait !== Infinity ? this.wait * 1000 : undefined,
			[], [], [], 0
		];

		// eslint-disable-next-line no-constant-condition
		while(true) {
			let val = vals && vals[currentVal] ? vals[currentVal] : null;
			let valid = val ? await this.validate(val, msg) : false;
			let attempts = 0;

			while(!valid || typeof valid === 'string') {
				attempts++;
				if (attempts > promptLimit) return { value: null, cancelled: 'promptLimit', prompts, answers };

				const embed = {
					author: { name: msg.client.user.tag, icon_url: msg.client.user.displayAvatarURL({ dynamic: true }), url: msg.client.options.invite },
					title: 'INFO',
					color: msg.client.getColor(msg.guild),
					footer: {
						text: wait ? `This will be automatically be cancelled in ${this.wait} seconds` : '',
						icon_url: wait ? `https://cdn.discordapp.com/emojis/733729770180706345.png?v=1` : ''
					},
					fields: [
						{
							name: `\u200b`,
							value: `Respond with **\`cancel\`** to cancel the command, or **\`finish\`** to finish entry up to this point.\n*Don't include the prefix and command name*`
						}
					]
				};
				if (val) {
					const escaped = escapeMarkdown(val).replace(/@/g, '@\u200b');
					embed.description = `	${valid ? valid : `You provided an invalid ${this.label}, "${escaped.length < 1850 ? escaped : '[too long to show]'}".\nPlease try again.`}`;
					prompts.push(await msg.boop({ embeds: [ embed ] }));
				} else if (!results.length) {
					embed.description = this.prompt;
					prompts.push(await msg.boop({ embeds: [ embed ] }));
				}

				const responses = await msg.channel.awaitMessages({ filter: msg2 => msg2.author.id === msg.author.id, max: 1, time: wait });
				if (responses && responses.size === 1) {
					answers.push(responses.first());
					val = answers[answers.length - 1].content;
				} else {
					return { value: null, cancelled: 'time', prompts, answers };
				}

				const lc = val.toLowerCase();
				if (lc === 'finish') return { value: results.length > 0 ? results : null, cancelled: this.default ? null : results.length > 0 ? null : 'user', prompts, answers };
				if (lc === 'cancel') return { value: null, cancelled: 'user', prompts, answers };
				valid = await this.validate(val, msg);
			}

			results.push(await this.parse(val, msg));

			if (vals) {
				currentVal++;
				if (currentVal === vals.length) return { value: results, cancelled: null, prompts, answers };
			}
		}
	}

	validate(val, msg) {
		const valid = this.validator ? this.validator(val, msg, this) : this.type.validate(val, msg, this);
		if (!valid || typeof valid === 'string') return this.error || valid;
		if (valid instanceof Promise) return valid.then(vld => !vld || typeof vld === 'string' ? this.error || vld : vld);
		return valid;
	}

	parse(val, msg) {
		if (this.parser) return this.parser(val, msg, this);
		return this.type.parse(val, msg, this);
	}

	isEmpty(val, msg) {
		if (this.emptyChecker) return this.emptyChecker(val, msg, this);
		if (this.type) return this.type.isEmpty(val, msg, this);
		if (Array.isArray(val)) return val.length === 0;
		return !val;
	}

	static validateInfo(client, info) { // eslint-disable-line complexity
		if (!client) throw new Error('The argument client must be specified.');
		if (typeof info !== 'object') throw new TypeError('Argument info must be an Object.');
		if (typeof info.key !== 'string') throw new TypeError('Argument key must be a string.');
		if (info.label && typeof info.label !== 'string') throw new TypeError('Argument label must be a string.');
		if (typeof info.prompt !== 'string') throw new TypeError('Argument prompt must be a string.');
		if (info.error && typeof info.error !== 'string') throw new TypeError('Argument error must be a string.');
		if (info.type && typeof info.type !== 'string') throw new TypeError('Argument type must be a string.');
		if (info.type && !info.type.includes('|') && !client.registry.types.has(info.type)) throw new RangeError(`Argument type "${info.type}" isn't registered.`);
		if (!info.type && !info.validate) throw new Error('Argument must have either "type" or "validate" specified.');
		if (info.validate && typeof info.validate !== 'function') throw new TypeError('Argument validate must be a function.');
		if (info.parse && typeof info.parse !== 'function') throw new TypeError('Argument parse must be a function.');
		if (!info.type && (!info.validate || !info.parse)) throw new Error('Argument must have both validate and parse since it doesn\'t have a type.');
		if (typeof info.wait !== 'undefined' && (typeof info.wait !== 'number' || Number.isNaN(info.wait))) throw new TypeError('Argument wait must be a number.');
	}

	static determineType(client, id) {
		if (!id) return null;
		if (!id.includes('|')) return client.registry.types.get(id);
		let type = client.registry.types.get(id);
		if (type) return type;
		type = new ArgumentUnionType(client, id);
		client.registry.registerType(type);
		return type;
	}
}

module.exports = Argument;
