const { Command, RichDisplay } = require('elaracmdo');
const Discord = require('discord.js');

module.exports = class HelpCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'help',
            group: 'bot',
            memberName: 'help',
            aliases: [`h`, `halp`, `command`, `commands`],
            description: 'Displays a list of available commands, or detailed information for a specified command.',
            examples: [`help`, `help prefix`],
            guarded: true,
            guildOnly: true,
	        clientPermissions: ["EMBED_LINKS", "ADD_REACTIONS", "SEND_MESSAGES"],
            throttling: Globalcooldown.default,
            args: [{
                key: 'command',
                prompt: 'Which command would you like to view the help for?',
                type: 'string',
                default: ''
            }]
        });
    }

    async run(message, args) { 
      try{
        let user = this.client.user;
        let color = message.guild ? message.member.displayColor : message.guild.color;
        const groups = this.client.registry.groups;
        const commands = this.client.registry.findCommands(args.command, false, message);
        const showAll = args.command && args.command.toLowerCase() === 'all';
        if(args.command === "groups"){
            let e = new Discord.MessageEmbed()
            .setAuthor(user.tag, user.displayAvatarURL())
            .setColor(color)
            .setTitle(`All Groups`)
            .setDescription(`
            ${groups.map(c => `${c.name} (${c.id}) [${c.commands.size}]`).join('\n')}
            `)
            return message.say(e)
        }
        if(args.command && !showAll){
             if(commands.length === 1){
                  let cmd = commands[0];
                  if(!this.client.isOwner(message.author.id) && cmd.hidden === true) return;
                  let s = "▫",
                      ss = "◽";
                  let e = new Discord.MessageEmbed()
                  .setAuthor(user.tag, user.displayAvatarURL())
                  .setColor(color)
                  .setTitle(`Command Help`)
                
                  .setDescription(`
                  ${s}Name: ${cmd.name}\n${s}Aliases: ${cmd.aliases.length === 0 ? "N/A": cmd.aliases.map(c => `\`${c}\``).join(", ")}\n${s}Group: ${cmd.group.name} (\`${cmd.group.id}\`)\n${s}Details: ${cmd.details || "No extra details"}\n${s}Description: ${cmd.description || "No description set"}\n${s}Guarded: ${this.client.f.developer.Enabled(cmd.guarded)}\n${s}Permissions\n${ss}Bot: ${this.permFormat(cmd.clientPermissions, ["SEND_MESSAGES", "EMBED_LINKS", "VIEW_CHANNEL"])}\n${ss}Member: ${this.permFormat(cmd.userPermissions, ["SEND_MESSAGES", "VIEW_CHANNEL"])}\n${s}Only\n${ss}Server: ${this.client.f.developer.Enabled(cmd.guildOnly)}\n${ss}DMs: ${this.client.f.developer.Enabled(cmd.dmOnly)}\n${ss}NSFW: ${this.client.f.developer.Enabled(cmd.nsfw)}
                  `);
                  if(cmd.examples.filter(c => c.toUpperCase() !== "NO_EXAMPLE_ADDED").length !== 0){
                      e.addField(`Examples`, cmd.examples.map(c => `${!c.startsWith(message.guild.getPrefix()) ? message.guild.getPrefix() : ""}${c}`).join("\n").slice(0, 1000));
                  }
                  return message.say(e).catch(() => {});
             }else{
                 return message.channel.send({
                     embed: {
                        author: {
                             name: user.tag, 
                             icon_url: user.displayAvatarURL({dynamic: true})
                        }, 
                        title: `Command Help`, 
                        color: 0xFF0000, 
                        description: `Command (\`${args.command.slice(0, 1000)}\`) wasn't found.\nUse: \`${message.guild ? message.guild.commandPrefix : this.client.commandPrefix}help\` to view all of the commands!`
                    }
                }).catch(() => {});
             }
        }else{
            if(message.guild){
            let e = new Discord.MessageEmbed()
            .setAuthor(message.guild.name, message.guild.iconURL({dynamic: true}))
            .setColor(color)
            let display = new RichDisplay(e)
            groups.forEach(g => {
                if(g.commands.size === 0) return;
                let commands = g.commands.map(c => `**${c.name}**${c.nsfw ? "(NSFW)" : ""} → ${c.description}`)
                if(g.id === "admin" && !message.member.permissions.has(`MANAGE_GUILD`)) return;
                if(g.id === "mod" && !message.member.permissions.has("MANAGE_MESSAGES")) return;
                if(g.id === ("owner" || "owner/misc") && !this.client.isOwner(message.author.id)) return;
                display.addPage(e => e.setDescription(commands.join('\n')).setTitle(g.name))
            });
            display.setFooterPrefix('Here are all of the commands you can use. Page: ')
            display.run(await message.channel.send(`Loading...`));
        }else{
         return message.success(`View the commands list here: ${this.client.config.misc.website.url}/commands\nUse: \`${this.client.commandPrefix}help\` in a server channel to view all of the commands.`)
        }
    }
      }catch(e){
	    message.error(e.message);
      }
    }
    permFormat(perms, def){
        let format = (array) => array.map(c => `\`${c}\``).join(", ");
        if(!perms) return format(def);
        if(perms.length === 0) return format(def);
        return format(perms);
    }
};
