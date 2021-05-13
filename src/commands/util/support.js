const Command = require('../base');
const Discord = require('discord.js');
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
            throttling: Globalcooldown.default,
        })
    }
    async run(message) {
        let embed = new Discord.MessageEmbed()
            .setAuthor(`${this.client.user.username} Support`, this.client.user.displayAvatarURL())
            .setColor(this.client.getColor(message))
            .setDescription(this.client.options.invite)
        return message.boop(embed);
    }
}
