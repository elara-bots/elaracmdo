const { Command } = require('elaracmdo'),
      { inspect } = require('util'),
		time = [];

module.exports = class EvalCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'eval',
            aliases: [`e`, `ev`, `eva`, `code`],
			group: 'owner',
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
		if([ 'client[', 'bot[', '.token', '["token"]', "['token']", '[`token`]' ].filter(c => message.content.toLowerCase().includes(c)).length !== 0) return message.error(`How about you go shove your hands in a blender and turn it on, that sounds like a better idea, now if you don't mind.. please fuck off.`);
		// eslint-disable-next-line no-unused-vars
		let [ client, guild, evalembed ] = [
			message.client,
			(id) => this.client.guilds.cache.get(id),
			{ title: "Results", author: { name: this.client.user.tag, icon_url: this.client.user.displayAvatarURL({ dynamic: true }) }, color: global.util.colors.purple, timestamp: new Date() },
		];
	// eslint-disable-next-line space-before-function-paren
	// eslint-disable-next-line no-unused-vars
	const doReply = async (val) => {
			if(val instanceof Error) return message.channel.send({ embeds: [ { ...evalembed, title: "CallBack Error", description: `\`${val}\`` } ] }).catch(() => null);
			const result = await this.makeResultMessages(val, global.process.hrtime(this.hrStart));
			if(Array.isArray(result)) for(const item of result) message.channel.send({ embeds: [ { ...evalembed, description: item } ] }).catch(() => null);
			else return message.channel.send({ embeds: [ { ...evalembed, description: result } ] }).catch(() => null);
		};
		let hrDiff;
		try {
			let sync = [ '-a', '-async', '--async', '{async}' ];
			let c = sync.filter(d => message.content.toLowerCase().includes(d.toLowerCase()));
			const hrStart = global.process.hrtime();
			if (args.script.startsWith('```js') && args.script.endsWith('```')) args.script = args.script.replace('```js', '').replace('```', '');
			args.script = args.script.replace(/-ignore|-i/gi, '');
			this.lastResult = eval(c.length !== 0 ? `(async () => {\n${args.script.replace(/-async|-a|--async|{async}/gi, '')}\n})();` : args.script);
			if(this.lastResult instanceof Promise && typeof this.lastResult === 'object') this.lastResult = await this.lastResult;
			if(this.lastResult === undefined && message.content.toLowerCase().match(/-ignore|-i/gi)) return null;
			hrDiff = global.process.hrtime(hrStart);
		} catch(err) {
			return message.channel.send({ embeds: [ { ...evalembed, title: "Error while evaluating", description: `\`\`\`diff\n- ${err}\`\`\`` } ] }).catch(() => null);
		}
		this.hrStart = global.process.hrtime();
		let response = await this.makeResultMessages(this.lastResult, hrDiff, args.script, message.editable);
		if (message.editable) {
            if (response instanceof Array) {
                if (response.length > 0) response = response.slice(1, response.length - 1);
                for (const re of response) message.channel.send({ content: re }).catch(() => null);
                return null;
            } else {
				if(response.length > 4096) return message.channel.send({ 
					embeds: [
						{
							...evalembed,
							footer: { text: `Executed in: ${time[0]}` },
						}
					],
					components: [ { type: 1, components: [ { label: "Output", style: 5, type: 2, url: await this.client.f.misc.bin('Output', await this.pastebinresponse(this.lastResult, hrDiff, args.script, message.editable)) } ] } ]
				}).catch(() => null);
                return message.channel.send({ 
					embeds: [ 
						{
							...evalembed,
							description: response,
							footer: { text: `Executed in: ${time[0]}` }
						}
					] 
				}).catch(() => null);
            }
        }else{
			if(response.length > 4096) return message.channel.send({ 
				embeds: [
					{
						...evalembed,
						footer: { text: `Executed in: ${time[0]}` },
					}
				],
				components: [ { type: 1, components: [ { label: "Output", style: 5, type: 2, url: await this.client.f.misc.bin('Output', await this.pastebinresponse(this.lastResult, hrDiff, args.script, message.editable)) } ] } ]
			}).catch(() => null);
			return message.channel.send({ 
				embeds: [ 
					{
						...evalembed,
						description: response,
						footer: { text: `Executed in: ${time[0]}` }
					}
				] 
			}).catch(() => null);
        }
	}

	async makeResultMessages(result, hrDiff, input = null, editable = false) {
		const inspected = inspect(result, { depth: 0 }).replace(new RegExp('!!NL!!', 'g'), '\n').replace(this.sensitivePattern, '');
		let i = await this.filterArgs(inspected);
		if(input) {
			if(hrDiff) time.push(`${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.`);
			return `${editable ? `\`\`\`js\n${input}\`\`\`` : ''}
			\`\`\`js\n${i}\`\`\``;
		} else {
			if(hrDiff) time.push(`${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.`);
			return `\`\`\`js\n${i}\`\`\``;
		}
	}
	async pastebinresponse(result, hrDiff, input = null, editable = false) {
        const inspected = inspect(result, { depth: 0 }).replace(new RegExp('!!NL!!', 'g'), '\n').replace(this.sensitivePattern, 'no u');
        let i = await this.filterArgs(inspected);
		if(input) {
			if(hrDiff) time.push(`${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.`);
			return `${editable ? `${input}` : ''}
			${i}`;
		} else {
			if(hrDiff) time.push(`${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.`);
			return i;
		}
	}
	filterArgs(args){
		return args.replace(new RegExp(this.client.config.token, 'g'), '');
	}
	get sensitivePattern() {
		if(!this._sensitivePattern) {
			let pattern = '';
			if(this.client.token) pattern += this.client.token.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
			Object.defineProperty(this, '_sensitivePattern', { value: new RegExp(pattern, 'gi'), configurable: false });
		}
		return this._sensitivePattern;
	}
};
