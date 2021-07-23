const Command = require('../base');

module.exports = class SCommand extends Command {
    constructor(client) {
        super(client, {
            name: "support",
            aliases: [`botsupport`],
            examples: [
                `%PREFIX%support`
            ],
            description: "Gives you the invite to the support server",
            group: "bot",
            clientPermissions: global.PERMS.basic,
            throttling: { usage: 2, duration: 10 }
        })
    }
    async run(message) {
        return message.channel.send({
            reply: { messageReference: message, failIfNotExists: false },
            allowedMentions: { parse: [] },
            embeds: [
                { 
                    author: { name: this.client.user.tag, icon_url: this.client.user.displayAvatarURL({ dynamic: true }), url: this.client.options.invite },
                    color: this.client.getColor(message.guild),
                    title: `Bot Support`,
                    description: `Click on the button below!`,
                    timestamp: new Date()
                }
            ],
            components: this.client.f?.button ? [ { type: 1, components: [ global.support(this.client) ] } ] : []
        });
    }
}
