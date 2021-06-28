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
            components: this.client.f?.button ? [ 
                { 
                    type: 1, 
                    components: [ 
                        this.client.f.button({ title: `Support`, emoji: { name: "Discord", id: "847624594717671476" }, style: 5, url: this.client.options.invite }) 
                    ] 
                } 
            ] : []
        });
    }
}
