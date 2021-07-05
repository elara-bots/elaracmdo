const Command = require('../base');

module.exports = class EnableCommandCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'enable',
			aliases: ['enable-command', 'cmd-on', 'command-on'],
			group: 'commands',
			memberName: 'enable',
			description: 'Enables a command or command group.',
			details: `The argument must be the name/ID (partial or whole) of a command or command group.\nOnly people with manage server permission use this command.`,
			examples: ['enable util', 'enable Utility', 'enable prefix'],
			clientPermissions: global.PERMS.basic,
			userGuildPermissions: [ global.PERMS.manage.server ],
			guarded: true,
			throttling: { usages: 2, duration: 20 },
			args: [
				{
					key: 'cmdOrGrp',
					label: 'command/group',
					prompt: 'Which command or group would you like to enable?',
					type: 'group|command'
				}
			]
		});
	}

	async run(msg, args) {
		let name = `${args.cmdOrGrp.group ? "Command" : "Group"} (\`${args.cmdOrGrp.name}\`)`;
		if(args.cmdOrGrp.isEnabledIn(msg.guild)) return msg.error(`${name} already is enabled!`)
		let db = await this.client.dbs.getSettings(msg.guild);
		if(db.misc.commands.includes(args.cmdOrGrp.name)){
			db.misc.commands = db.misc.commands.filter(c => c !== args.cmdOrGrp.name);
			await db.save().catch(() => {});
		}
		args.cmdOrGrp.setEnabledIn(msg.guild, true);
		return msg.success(`${name} is now enabled!`) 
	}
};
