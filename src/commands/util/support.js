const Command = require('../base');

module.exports = class SCommand extends Command {
    constructor(client) {
        super(client, {
            name: "support",
            memberName: "support",
            aliases: [`botsupport`],
            examples: [`${client.commandPrefix}support`],
            description: "Gives you the invite to the support server",
            group: "bot",
            clientPermissions: ["EMBED_LINKS", "SEND_MESSAGES"],
            throttling: Globalcooldown.default
        })
    }
    async run(message) {
        return message.custom(`${this.client.util.emojis.robot} Support: ${this.client.options.invite}`);
    }
}
