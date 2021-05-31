const {Command} = require('elaracmdo'), Discord = require('discord.js');
module.exports = class BotinfoCommand extends Command {
    constructor(client) {
        super(client, {
            name: "botinfo",
            group: "bot",
            memberName: "botinfo",
            aliases: [`info`, `binfo`],
            description: "Gives you the bots information",
            examples: [`${client.commandPrefix}botinfo`],
            clientPermissions: ["EMBED_LINKS", "SEND_MESSAGES"],
            throttling: Globalcooldown.default
        })
        this.ss = "◽";
        this.s = "▫";
    }
    async run(message) {
        const statuses = {
            "online": "Online", 
            "idle": "Idle",
            "dnd": "DND",
            "invisible": "Offline"
        },
            a = (name, link) => `**[${name}](${link})**`,
            INVITE = `https://discord.com/oauth2/authorize?client_id=${this.client.user.id}&permissions=1543892167&scope=bot%20applications.commands`,
            links = [
                a(`GitHub`, `https://github.com/elara-bots`),
                a(`Feedback`, `https://my.elara.services/account/feedback`),
            ],
            botID = "455166272339181589",
            emojis = {
                "topgg": "<:topgg:735559264424428031>",
                "del": "<:del:735559484247638053>",
                "dbots": "<:dbots:735559330878849234>",
                "dboats": "<:dboats:735559399614971904>",
                "dbl": "<:dbl:735559805699096576>",
                "bfd": "<:bfd:735559564153454734>"
            },

            botlists = [
                `${emojis.topgg} ${a(`Top gg`, `https://top.gg/bot/${botID}`)}`,
                `${emojis.dboats} ${a(`Discord Boats`, `https://discord.boats/bot/${botID}`)}`,
                `${emojis.dbots} ${a(`Discord Bots`, `https://discord.bots.gg/bots/${botID}`)}`,
                `${emojis.del} ${a(`Discord Extreme List`, `https://discordextremelist.xyz/en-US/bots/${botID}`)}`,
                `${emojis.bfd} ${a(`Bots For Discord`, `https://botsfordiscord.com/bot/${botID}`)}`,
                `${emojis.dbl} ${a(`Discord Bot List`, `https://discordbotlist.com/bots/${botID}`)}`
            ]
        let user = this.client.user;
        let embed = new Discord.MessageEmbed()
        .setAuthor(`Information about myself`, user.displayAvatarURL({dynamic: true}))
        .setColor(this.client.getColor(message.guild))
        .setThumbnail(user.displayAvatarURL({dynamic: true}))
        .setDescription(`${this.s}User\n${this.ss}Name: ${user.tag}\n${this.ss}ID: ${user.id}\n${this.ss}Avatar: [URL](${user.displayAvatarURL({dynamic: true})})\n${this.ss}Created: ${new Date(user.createdAt).toLocaleString("en-US", {timeZone: "America/Los_Angeles"})} (PST)\n\n
        ${this.s}Misc\n${this.ss}Status: ${this.client.util.status[user.presence.status]} ${statuses[user.presence.status]}\n${this.ss}Prefixes: \`${this.client.getPrefix(message.guild)}\`, \`@${user.tag}\`\n${this.ss}Owner${this.client.owners.length === 1 ? "" : "s"}: ${this.client.owners.map(c => `\`${c.tag}\``).join(", ")}\n${this.ss}Mutual Server${this.client.guilds.cache.filter(g => g.members.cache.has(message.author.id)).size === 1 ? "" : "s"}: ${this.client.guilds.cache.filter(g => g.members.cache.has(message.author.id)).size}\n${this.ss}Shards: ${this.client.ws.shards.size}\n\n${links.join(" | ")}`)
        .addField(`Bot Lists`, botlists.join("\n"))
        return message.channel.send(null, {
            replyTo: { id: message.id },
            allowedMentions: { parse: [] },
            embed,
            components: this.client.f?.button ? [
                {
                    type: 1,
                    components: [
                        this.client.f.button({ title: `Invite`, style: 5, url: INVITE, emoji: { name: "Invite", id: "841655450512261140" } }),
                        this.client.f.button({ title: `Support`, emoji: { name: "Discord", id: "847624594717671476" }, style: 5, url: this.client.options.invite }),
                        this.client.f.button({ title: `Vote`, style: 5, url: `https://superchiefyt.xyz/vote`, emoji: { name: "Upvote", id: "784243907029762088" } }),
                        this.client.f.button({ title: `Privacy`, style: 5, url: `https://my.elara.services/privacy`, emoji: { name: "🕵️" } }),
                        this.client.f.button({ title: `TOS`, style: 5, url: `https://my.elara.services/terms`, emoji: { name: "Mod", id: "847719612846047263" } })
                    ]
                }
            ] : null 
        })
    }
}
