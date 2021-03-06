const Command = require('../base'),
      moment = require('moment'),
      getFormat = (date, compare = true) => moment.duration(compare ? new Date().getTime() - date.getTime() : date).format("D[d], H[h], m[m], s[s]");
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
        this.field = (name, value, inline = false) => ({ name, value, inline });
    }

    async run(msg) {
        let author = { name: this.client.user.tag, icon_url: this.client.user.displayAvatarURL({dynamic: true}), url: this.client.options.invite },  
            footer = { text: `Requested by: @${msg.author.tag}`, icon_url: msg.author.displayAvatarURL({dynamic: true}) },
            components = this.client.f?.button ? [ 
                { 
                    type: 1, 
                    components: [ this.client.f.button({ title: `Support`, emoji: { name: "Discord", id: "847624594717671476" }, style: 5, url: this.client.options.invite })  ] 
                } 
            ] : [],
            message = await msg.boop({
                embed: {
                    author, footer,
                    timestamp: new Date(), 
                    color: this.client.getColor(msg.guild), 
                    description: `${this.client.util.emojis.eload} One moment.`
                },
                components: this.inServer(msg.author.id) ? undefined : components
            }),
            robot = this.client.util.emojis.robot;
	    if(!message) return null
        if(!this.client.isSupport(msg.author.id)) return message.edit({
            embed: {
                author, footer,
                title: `${robot} Status ${robot}`,
                color: this.client.getColor(message.guild),
                fields: [
                    this.field(`Message Latency`, `${message.createdTimestamp - msg.createdTimestamp}ms`, true),
                    this.field(`API Latency`, `${Math.round(this.client.ws.ping)}ms`, true),
                    this.field(`Uptime`, `${getFormat(this.client.uptime, false)}`, true)
                ]
            },
            components: this.inServer(msg.author.id) ? undefined : components
        });
        function secondsToHms(seconds){ // day, h, m and s
            var days     = Math.floor(seconds / (24*60*60));
                seconds -= days    * (24*60*60);
            var hours    = Math.floor(seconds / (60*60));
                seconds -= hours   * (60*60);
            var minutes  = Math.floor(seconds / (60));
                seconds -= minutes * (60);
            return `${((0<days)?(days+"d, "):"")}${hours}h, ${minutes}m, ${seconds}s`;
        }
        return message.edit({
            embed: {
                author,
                title: `${this.client.util.emojis.robot} Status ${this.client.util.emojis.robot}`,
                color: this.client.getColor(message.guild),
                timestamp: new Date(),
                fields: [
                    this.field(`💾 Memory`, `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`, true),
                    this.field(`🏓 Latency`, `▫Message: **\`\`${message.createdTimestamp - msg.createdTimestamp}ms\`\`**\n▫API: **\`\`${this.client.ws.ping}ms\`\`**`, true),
                    this.field(`📡 Uptime`, `▫Host: ${secondsToHms(require("os").uptime())}\n▫Process: ${getFormat(this.client.uptime, false)}`, true)
                ]
            }
        });
    };
    inServer(id){
        let guild = this.client.guilds.cache.get("499409162661396481");
        if(!guild || !guild.available || !guild.members.cache.get(id)) return false;
        return true;
    };
};
