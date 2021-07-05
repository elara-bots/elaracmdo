const Command = require('../base');

module.exports = class ListGroupsCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'groups',
			aliases: ['list-groups', 'show-groups'],
			group: 'commands',
			memberName: 'groups',
			description: 'Lists all command groups.',
			details: 'Only administrators may use this command.',
			clientPermissions: ["EMBED_LINKS", "SEND_MESSAGES"],
			userGuildPermissions: ["ADMINISTRATOR"],
			guarded: true
		});
	}
	run(msg) {
		return msg.reply(global.strip(`
			__**Groups**__
			${this.client.registry.groups.map(grp =>
				`**${grp.name}:** ${grp.isEnabledIn(msg.guild) ? 'Enabled' : 'Disabled'}`
			).join('\n')}
		`));
	}
};
