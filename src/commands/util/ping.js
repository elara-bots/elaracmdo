const Command = require('../base'),
      moment = require('moment');
require("moment-duration-format");
module.exports = class PingCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'ping',
            aliases: ["pong", "pung", `uptime`],
            group: 'bot',
            memberName: 'ping',
            description: 'Shows the ping for the bot',
            examples: ['ping'],
	        clientPermissions: ["EMBED_LINKS", "SEND_MESSAGES"],
            throttling: Globalcooldown.default,
        });
    }

    async run(msg) {
        let author = {
            name: this.client.user.tag,
            icon_url: this.client.user.displayAvatarURL({dynamic: true}),
            url: this.client.options.invite
            },  
            footer = {
                text: `Requested by: @${msg.author.tag}`,
                icon_url: msg.author.displayAvatarURL({dynamic: true})
            },
            message = await msg.channel.send({
                embed: {
                    author, footer,
                    timestamp: new Date(), 
                    color: this.client.getColor(msg.guild), 
                    description: `${this.client.util.emojis.eload} One moment.`
                }
            }),
            robot = this.client.util.emojis.robot;
        message.edit({embed: {
            author, footer,
            title: `${robot} Status ${robot}`,
            color: this.client.getColor(message.guild),
            fields: [
                this.field(`Message Latency`, `${message.createdTimestamp - msg.createdTimestamp}ms`),
                this.field(`API Latency`, `${Math.round(this.client.ws.ping)}ms`),
                this.field(`Uptime`, `${moment.duration(this.client.uptime).format("d[d], h[h], m[m], s[s]")}`)
            ]
        }});
    }
    field(name, value, inline = true){
        return {name, value, inline}
    }
};
