const Command = require("../base");

module.exports = class DisableCommandCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'disable',
			aliases: ['disable-command', 'cmd-off', 'command-off'],
			group: 'util',
			description: 'Disables a command or command group.',
			details: `The argument must be the name/ID (partial or whole) of a command or command group.\nOnly people with manage server permission can use this command.`,
			examples: ['disable util', 'disable Utility', 'disable prefix'],
			clientPermissions: global.PERMS.basic,
			userGuildPermissions: [ global.PERMS.manage.server ],
			guarded: true,
			throttling: { usages: 2, duration: 20 },
			args: [
				{
					key: 'cmdOrGrp',
					label: 'command/group',
					prompt: 'Which command or group would you like to disable?',
					type: 'group|command'
				}
			]
		});
	}

	async run(msg, args) {
		let name = `${args.cmdOrGrp.group ? "Command" : "Group"} (\`${args.cmdOrGrp.name}\`)`;
		if(!args.cmdOrGrp.isEnabledIn(msg.guild)) return msg.error(`${name} already is disabled!`)
		if(args.cmdOrGrp.guarded) return msg.error(`${name} is gaurded so it cannot be disabled!`);
		let db = await this.client.dbs.getSettings(msg.guild);
		if(!db.misc.commands.includes(args.cmdOrGrp.name)){
			db.misc.commands.push(args.cmdOrGrp.name);
			await db.save().catch(() => {});
		}
		args.cmdOrGrp.setEnabledIn(msg.guild, false);
		return msg.success(`${name} is now disabled!`) 
	}
};
