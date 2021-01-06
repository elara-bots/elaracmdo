const {MessageEmbed} = require('discord.js'),
      {Command, util: {escapeRegex}} = require('elaracmdo'),
      util = require('util'),
      time = [];
require("moment-duration-format")

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
	args.script = args.script.replace(new RegExp(this.client.token, "g"), "Fuck Off, Muppet.")
	  const bot = message.client, 
			  msg = message, 
			  client = message.client, 
			  lastResult = this.lastResult, 
			  f = client.f,  
			  guild = (id) => this.client.guilds.cache.get(id),
			  string = (thing, spacing = 2) => {
				return JSON.stringify(thing, null, spacing)
			  }, 
			  code = (thing, options = {code: "json", split: true, string: true}) => {
				  return msg.say(options.string ? string(thing) : thing, options)
			  },
			  evalembed = new MessageEmbed().setAuthor(client.user.tag, client.user.displayAvatarURL()).setColor(client.util.colors.default).setTimestamp(),
			doReply = async (val) => {
			if(val instanceof Error) {
				evalembed.setTitle(`Callback Error`).setDescription(`\`${val}\``)
				return message.channel.send(evalembed).catch(() => {});
			} else {
				const result = await this.makeResultMessages(val, process.hrtime(this.hrStart));
				if(Array.isArray(result)) {
					for(const item of result){
						evalembed.setTitle(`Result`).setDescription(item)
						return message.channel.send(evalembed).catch(() => {});
					}
				} else {
					evalembed.setTitle(`Result`).setDescription(result)
					return message.channel.send(evalembed).catch(() => {});
				}
			}
		};
		let hrDiff;
		try {
			let sync = ["-a", "-async", "--async", "{async}"]
			let c = sync.filter(c => msg.content.toLowerCase().includes(c.toLowerCase()));
			const hrStart = process.hrtime();
			if (args.script.startsWith('```js') && args.script.endsWith('```')) args.script = args.script.replace('```js', '').replace('```', '');
			args.script = args.script.replace(/-ignore|-i/gi, "")
			this.lastResult = eval(c.length !== 0 ? `(async () => {\n${args.script.replace(/-async|-a|--async|{async}/gi, "")}\n})();` : args.script);
			if(this.lastResult instanceof Promise && typeof this.lastResult === "object") this.lastResult = await this.lastResult;
			if(this.lastResult === undefined && msg.content.toLowerCase().match(/-ignore|-i/gi)) return null;
			hrDiff = process.hrtime(hrStart);
		} catch(err) {
			evalembed.setTitle(`Error while evaluating`).setDescription(`\`\`\`diff\n- ${err}\`\`\``)
			return message.channel.send(evalembed).catch(() => {});
		}
		this.hrStart = process.hrtime();
		const response = await this.makeResultMessages(this.lastResult, hrDiff, args.script, message.editable);
		if (msg.editable) {
            if (response instanceof Array) {
                if (response.length > 0) response = response.slice(1, response.length - 1);
                for (const re of response) msg.say(re);
                return null;
            } else {
				if(response.length >= 2040){
					evalembed
					.setTitle(`Result`)
					.setDescription(await this.client.f.misc.bin('Output', await this.pastebinresponse(this.lastResult, hrDiff, args.script, message.editable)))
					.setFooter(`Executed in: ${time[0]}`)
					return message.channel.send(evalembed).catch(() => {});
				}
				evalembed
				.setTitle(`Result`)
				.setDescription(response)
				.setFooter(`Executed in: ${time[0]}`)
                return message.channel.send(evalembed).catch(() => {});
            }
        }else{
			if(response.length >= 2040){
				evalembed
				.setTitle(`Result`)
				.setDescription(await this.client.f.misc.bin('Output', await this.pastebinresponse(this.lastResult, hrDiff, args.script, message.editable)))
				.setFooter(`Executed in: ${time[0]}`)
				return message.channel.send(evalembed).catch(() => {});
			}
            evalembed
            .setTitle(`Result`)
			.setDescription(response)
			.setFooter(`Executed in: ${time[0]}`)
            return message.channel.send(evalembed).catch(() => {});
        }
	}

	async makeResultMessages(result, hrDiff, input = null, editable = false) {
		const inspected = util.inspect(result, { depth: 0 }).replace(new RegExp('!!NL!!', 'g'), '\n').replace(this.sensitivePattern, '');
		let i = await this.filterArgs(inspected);
		if(input) {
			if(hrDiff){
			time.push(`${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.`)
			}
			return `${editable ? `\`\`\`js\n${input}\`\`\`` : ''}
			\`\`\`js\n${i}\`\`\``;
		} else {
			if(hrDiff){
			time.push(`${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.`)
			}
			return `\`\`\`js\n${i}\`\`\``;
		}
	}
	async pastebinresponse(result, hrDiff, input = null, editable = false) {
        const inspected = util.inspect(result, { depth: 0 }).replace(new RegExp('!!NL!!', 'g'), '\n').replace(this.sensitivePattern, 'no u')
        let i = await this.filterArgs(inspected);
		if(input) {
			if(hrDiff){
			time.push(`${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.`)
			}
			return `${editable ? `${input}` : ''}
			${i}`;
		} else {
			if(hrDiff){
			time.push(`${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.`)
			}
			return i;
		}
	}
	filterArgs(args){
		return args.replace(new RegExp(this.client.config.token, "g"), "").replace(this.client.config.mongo, "")
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
