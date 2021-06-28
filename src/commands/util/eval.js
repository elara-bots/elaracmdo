/* eslint-disable consistent-return */
/* eslint-disable space-before-blocks */
/* eslint-disable keyword-spacing */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable newline-per-chained-call */
/* eslint-disable arrow-parens */
/* eslint-disable no-unused-vars */
/* eslint-disable id-length */
/* eslint-disable no-mixed-requires */
/* eslint-disable indent-legacy */
const { MessageEmbed } = require('discord.js'),
      { Command, util: { escapeRegex } } = require('elaracmdo'),
      util = require('util'),
      time = [];
require('moment-duration-format');

module.exports = class EvalCommand extends Command {
	constructor(client) {
	super(client, {
            name: 'eval',
            aliases: [`e`, `ev`, `eva`, `code`],
	    	group: 'owner',
	    	memberName: 'eval',
			description: 'Executes JavaScript code.',
			details: 'Only the bot owner(s) may use this command.',
			ownerOnly: true,
			guarded: true,
            hidden: true,
			args: [
				{
					key: 'script',
					prompt: 'What code would you like to evaluate?',
					type: 'string'
				}
			]
		});

		this.lastResult = null;
		Object.defineProperty(this, '_sensitivePattern', { value: null, configurable: true });
	}

async run(message, args) {
	const repl = [
		'client[',
		'bot[',
		'.token',
		'["token"]',
		"['token']",
		'[`token`]'
	];
	if(repl.filter(c => message.content.toLowerCase().includes(c)).length !== 0) return message.error(`How about you go shove your hands in a blender and turn it on, that sounds like a better idea, now if you don't mind.. please fuck off.`);
	let [ bot, msg, client, lastResult, f, guild, string, evalembed, code ] = [
		message.client,
		message,
		message.client,
		this.lastResult,
		message.client.f,
		(id) => this.client.guilds.cache.get(id),
		(t, s = 2) => JSON.stringify(t, undefined, s),
		new MessageEmbed().setAuthor(this.client.user.tag, this.client.user.displayAvatarURL({ dynamic: true })).setColor(this.client.util.colors.default).setTimestamp(),
		(thing, options = { code: 'json', split: true, string: true }) => msg.say({ content: options.string ? string(thing) : thing, ...options })
	];
	  // eslint-disable-next-line space-before-function-paren
	  const doReply = async (val) => {
			if(val instanceof Error) {
				evalembed.setTitle(`Callback Error`).setDescription(`\`${val}\``);
				return message.channel.send({ embeds: [ evalembed ] }).catch(() => null);
			} else {
				const result = await this.makeResultMessages(val, process.hrtime(this.hrStart));
				if(Array.isArray(result)) {
					for(const item of result) {
						evalembed.setTitle(`Result`).setDescription(item);
						return message.channel.send({ embeds: [ evalembed ] }).catch(() => null);
					}
				} else {
					evalembed.setTitle(`Result`).setDescription(result);
					return message.channel.send({ embeds: [ evalembed ] }).catch(() => null);
				}
			}
		};
		let hrDiff;
		try {
			let sync = ['-a', '-async', '--async', '{async}'];
			let c = sync.filter(d => msg.content.toLowerCase().includes(d.toLowerCase()));
			const hrStart = process.hrtime();
			if (args.script.startsWith('```js') && args.script.endsWith('```')) args.script = args.script.replace('```js', '').replace('```', '');
			args.script = args.script.replace(/-ignore|-i/gi, '');
			this.lastResult = eval(c.length !== 0 ? `(async () => {\n${args.script.replace(/-async|-a|--async|{async}/gi, '')}\n})();` : args.script);
			if(this.lastResult instanceof Promise && typeof this.lastResult === 'object') this.lastResult = await this.lastResult;
			if(this.lastResult === undefined && msg.content.toLowerCase().match(/-ignore|-i/gi)) return null;
			hrDiff = process.hrtime(hrStart);
		} catch(err) {
			evalembed.setTitle(`Error while evaluating`).setDescription(`\`\`\`diff\n- ${err}\`\`\``);
			return message.channel.send({ embeds: [ evalembed ] }).catch(() => null);
		}
		this.hrStart = process.hrtime();
		let response = await this.makeResultMessages(this.lastResult, hrDiff, args.script, message.editable);
		if (msg.editable) {
            if (response instanceof Array) {
                if (response.length > 0) response = response.slice(1, response.length - 1);
                for (const re of response) msg.say({ content: re });
                return null;
            } else {
				if(response.length >= 2040) {
					evalembed
					.setTitle(`Result`)
					.setDescription(await this.client.f.misc.bin('Output', await this.pastebinresponse(this.lastResult, hrDiff, args.script, message.editable)))
					.setFooter(`Executed in: ${time[0]}`);
					return message.channel.send({ embeds: [ evalembed ] }).catch(() => null);
				}
				evalembed
				.setTitle(`Result`)
				.setDescription(response)
				.setFooter(`Executed in: ${time[0]}`);
                return message.channel.send({ embeds: [ evalembed ] }).catch(() => null);
            }
        }else{
			if(response.length >= 2040) {
				evalembed
				.setTitle(`Result`)
				.setDescription(await this.client.f.misc.bin('Output', await this.pastebinresponse(this.lastResult, hrDiff, args.script, message.editable)))
				.setFooter(`Executed in: ${time[0]}`);
				return message.channel.send({ embeds: [ evalembed ] }).catch(() => null);
			}
            evalembed
            .setTitle(`Result`)
			.setDescription(response)
			.setFooter(`Executed in: ${time[0]}`);
            return message.channel.send({ embeds: [ evalembed ] }).catch(() => null);
        }
	}

	async makeResultMessages(result, hrDiff, input = null, editable = false) {
		const inspected = util.inspect(result, { depth: 0 }).replace(new RegExp('!!NL!!', 'g'), '\n').replace(this.sensitivePattern, '');
		let i = await this.filterArgs(inspected);
		if(input) {
			if(hrDiff){
			time.push(`${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.`);
			}
			return `${editable ? `\`\`\`js\n${input}\`\`\`` : ''}
			\`\`\`js\n${i}\`\`\``;
		} else {
			if(hrDiff){
			time.push(`${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.`);
			}
			return `\`\`\`js\n${i}\`\`\``;
		}
	}
	async pastebinresponse(result, hrDiff, input = null, editable = false) {
        const inspected = util.inspect(result, { depth: 0 }).replace(new RegExp('!!NL!!', 'g'), '\n').replace(this.sensitivePattern, 'no u');
        let i = await this.filterArgs(inspected);
		if(input) {
			if(hrDiff){
			time.push(`${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.`);
			}
			return `${editable ? `${input}` : ''}
			${i}`;
		} else {
			if(hrDiff){
			time.push(`${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.`);
			}
			return i;
		}
	}
	filterArgs(args){
		return args.replace(new RegExp(this.client.config.token, 'g'), '');
	}
	get sensitivePattern() {
		if(!this._sensitivePattern) {
			let pattern = '';
			if(this.client.token) pattern += escapeRegex(this.client.token);
			Object.defineProperty(this, '_sensitivePattern', { value: new RegExp(pattern, 'gi'), configurable: false });
		}
		return this._sensitivePattern;
	}
};
