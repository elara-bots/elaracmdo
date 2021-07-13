const { Command } = require('elaracmdo'),
      { MessageEmbed } = require('discord.js');

module.exports = class BotinfoCommand extends Command {
    constructor(client) {
        super(client, {
            name: "botinfo",
            group: "bot",
            aliases: [`info`, `binfo`],
            description: "Gives you the bots info, or info on a snowflake you provide.",
            examples: [
                `${global.PREFIX}botinfo`, 
                `${global.PREFIX}botinfo (Snowflake/ID)`
            ],
            clientPermissions: global.PERMS.basic,
            throttling: { usage: 2, duration: 10 },
            args: [
                {
                    key: "id",
                    type: "string",
                    prompt: "What's the snowflake?",
                    default: ""
                }
            ]
        });
    }

    /**
     * @param {import("elaracmdo").CommandoMessage} message 
     * @param {object} [args]
     * @param {string} [args.id]
     */
    async run(message, { id }) {
        if(id && !isNaN(id) && this.client.f?.snowflake && this.client.f?.time) {
            let info = this.client.f.snowflake(id);
            if(info.binary === "0000000000000000000000000000000000000000000000000000000000000000") return message.error(`That isn't a valid Discord snowflake.`);
            let fields = [];
            if(message.guild) {
                let [ role, channel, emoji ] = [
                    message.guild.roles.cache.get(id),
                    message.guild.channels.cache.get(id),
                    message.guild.emojis.cache.get(id)
                ];
                if(message.guild.id === id) fields.push(`${global.s}Server: ${message.guild.name} (${message.guild.id})`);
                if(role) fields.push(`${global.s}Role: ${role.toString()} \`@${role.name}\` (${role.id})`);
                if(channel) fields.push(`${global.s}Channel: ${channel.toString()} \`#${channel.name}\` (${channel.id})`);
                if(emoji) fields.push(`${global.s}Emoji: ${emoji.toString()} \`${emoji.name}\` (${emoji.id})`);
                if(!role || !channel || !emoji) {
                    let user = this.client.users.cache.get(id) ?? await this.client.users.fetch(id, true).catch(() => null);
                    if(user) fields.push(`${global.s}User: ${user.toString()} \`@${user.tag}\` (${user.id})`)
                }
            }
            return message.boop({
                embeds: [{
                    author: { name: "Discord Snowflake", icon_url: `https://cdn.discordapp.com/emojis/${global.util.emojis.rdiscord}.png`, url: this.client.options.invite },
                    title: "Information",
                    thumbnail: { url: "https://cdn.discordapp.com/emojis/847624594717671476.png" },
                    description: `${global.s}Date: ${this.client.f.time(info.date, true)}\n${global.s}Timestamp: ${info.timestamp}\n${global.s}Increment: ${info.increment}\n${global.s}IDs:\n${global.ss}Process: ${info.processId}\n${global.ss}Worker: ${info.workerId}`,
                    fields: fields.length !== 0 ? [ { name: "Extra", value: fields.join("\n") } ] : undefined,
                    color: global.util.colors.purple,
                    timestamp: new Date(),
                    footer: { text: `Requested by: @${message.author.tag}`, icon_url: message.author.displayAvatarURL({ dynamic: true }) }
                }]
            })
        }
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
                `${emojis.bfd} ${a(`Bots For Discord`, `https://discords.com/bot/${botID}`)}`,
                `${emojis.dbl} ${a(`Discord Bot List`, `https://discordbotlist.com/bots/${botID}`)}`
            ]
        let user = this.client.user;
        let embed = new MessageEmbed()
        .setAuthor(`Information about me`, user.displayAvatarURL({ dynamic: true }))
        .setColor(this.client.getColor(message.guild))
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setDescription(`${global.s}User\n${global.ss}Name: ${user.tag}\n${global.ss}ID: ${user.id}\n${global.ss}Avatar: [URL](${user.displayAvatarURL({dynamic: true})})\n${global.ss}Created: ${global.unix(user.createdAt)}\n\n${global.s}Misc\n${global.ss}Status: ${global.util.status[user.presence.status]} ${statuses[user.presence.status]}\n${global.ss}Prefixes: \`${this.client.getPrefix(message.guild)}\`, \`@${user.tag}\`\n${global.ss}Owner${this.client.owners.length === 1 ? "" : "s"}: ${this.client.owners.map(c => `\`${c.tag}\``).join(", ")}\n${global.ss}Mutual Server${this.client.guilds.cache.filter(g => g.members.cache.has(message.author.id)).size === 1 ? "" : "s"}: ${this.client.guilds.cache.filter(g => g.members.cache.has(message.author.id)).size}\n${global.ss}Shards: ${this.client.ws.shards.size}\n\n${links.join(" | ")}`)
        .addField(`Bot Lists`, botlists.join("\n"))
        return message.channel.send({
            reply: { messageReference: message, failIfNotExists: false },
            allowedMentions: { parse: [] },
            embeds: [ embed ],
            components: this.client.f?.button ? [
                {
                    type: 1,
                    components: [
                        this.client.f.button({ title: `Invite`, style: 5, url: INVITE, emoji: { name: "Invite", id: global.util.emojis.rinvite } }),
                        this.client.f.button({ title: `Support`, emoji: { name: "Discord", id: global.util.emojis.rdiscord }, style: 5, url: this.client.options.invite }),
                        this.client.f.button({ title: `Vote`, style: 5, url: `https://superchiefyt.xyz/vote`, emoji: { name: "Upvote", id: "784243907029762088" } }),
                        this.client.f.button({ title: `Privacy`, style: 5, url: `https://my.elara.services/privacy`, emoji: { name: "🕵️" } }),
                        this.client.f.button({ title: `TOS`, style: 5, url: `https://my.elara.services/terms`, emoji: { name: "Mod", id: global.util.emojis.rmod } })
                    ]
                }
            ] : null 
        }).catch(e => global.log(`[CMD:${this.name}:ERROR]`, e));
    }
}
