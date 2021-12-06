const Argument = require('./argument');

module.exports = class ArgumentCollector {
	constructor(client, args, promptLimit = Infinity) {
		if (!client) throw new TypeError('Collector client must be specified.');
		if (!args || !Array.isArray(args)) throw new TypeError('Collector args must be an Array.');
		if (promptLimit === null) promptLimit = Infinity;
		this.client = client;
		this.args = new Array(args.length);
		let [ hasInfinite, hasOptional ] = [ false, false ];
		for (let i = 0; i < args.length; i++) {
			if (hasInfinite) throw new Error('No other argument may come after an infinite argument.');
			if (args[i].default !== null) hasOptional = true;
			else if (hasOptional) throw new Error('Required arguments may not come after optional arguments.');
			this.args[i] = new Argument(this.client, args[i]);
			if (this.args[i].infinite) hasInfinite = true;
		}

		this.promptLimit = promptLimit;
	}

	async obtain(msg, provided = [], promptLimit = this.promptLimit) {
		this.client.dispatcher.pending.add(`${msg.author.id}${msg.channel.id}`);
		const [ values, results ] = [ {}, [] ];

		try {
			for(let i = 0; i < this.args.length; i++) {
				/* eslint-disable no-await-in-loop */
				const arg = this.args[i];
				const result = await arg.obtain(msg, arg.infinite ? provided.slice(i) : provided[i], promptLimit);
				results.push(result);

				if (result.cancelled) {
					this.client.dispatcher.pending.delete(`${msg.author.id}${msg.channel.id}`);
					return {
						values: null, cancelled: result.cancelled,
						prompts: [].concat(...results.map(res => res.prompts)), answers: [].concat(...results.map(res => res.answers)) 
					};
				}
				values[arg.key] = result.value;
				/* eslint-enable no-await-in-loop */
			}
		} catch(err) {
			global.log(`[CMDO:COLLECTOR:OBTAIN]: ERROR`, err);
			this.client.dispatcher.pending.delete(`${msg.author.id}${msg.channel.id}`);
			throw err;
		}
		this.client.dispatcher.pending.delete(`${msg.author.id}${msg.channel.id}`);
		return {
			values,
			cancelled: null,
			prompts: [].concat(...results.map(res => res.prompts)),
			answers: [].concat(...results.map(res => res.answers))
		};
	}
}