const { Command } = require('elaracmdo');
module.exports = class NCommand extends Command {
    constructor(client) {
        super(client, {
            name: "invite",
            aliases: ["botinvite", `inv`, `bot`],
            examples: [`${client.commandPrefix}invite <bot id here>`],
            description: "Gives you a invite for the bot id you provide.",
            group: "info",
            clientPermissions: global.PERMS.basic,
            throttling: { usage: 2, duration: 10 },
            args: [
                {
                    key: 'user',
                    prompt: 'Please provide the bot id.',
                    type: 'user',
                    default: msg => msg.client.user
                }
            ]
        })
    }
    async run(message, { user }) {
        if(!user.bot) return message.error(`That is a user account, not a bot..`);
        let p = (name, num, slashCommands = true) => `[${name}](${this.client.options.http.api.replace("/api", "")}/oauth2/authorize?client_id=${this.convertID(user.id)}&permissions=${num}&scope=bot${slashCommands ? "%20applications.commands" : ""}${this.isOfficialClient(user.id) ? `&response_type=code&redirect_uri=${this.client.options.invite}` : ""})`,
            links = [
                `${p("All", "-1", false)} | ${p("All + /", "-1")}`,
                `${p("Administrator", "8", false)} | ${p("Administrator + /", "8")}`,
                `${p("Moderator", "1543892167", false)} | ${p("Moderator + /", "1543892167")}`,
                `${p("Normal", "67488833", false)} | ${p("Normal + /", "67488833")}`,
                `${p("None", "0", false)} | ${p("None + /", "0")}`,
            ]
        let components = this.client.f?.button ? [{ type: 1, components: [ global.support(this.client) ] }] : [];
        return message.boop({
          embeds: [{
              author: {
                  name: `Invite for: @${user.tag}`,
                  icon_url: user.displayAvatarURL({dynamic: true}),
                  url: this.client.user.equals(user) ? this.client.options.invite : undefined
              },
              color: this.client.getColor(message.guild),
              title: "Permissions",
              description: links.join("\n"),
              footer: { text: `Permissions | Permissions + / Slash Commands` }
          }],
          components: this.isOfficialClient(user.id) ? components : undefined
      })
    }
    isOfficialClient(id) {
        return [
            '480881356935790622', // @Kitten#1552
            '535824054763126784', // @ModBot#9095
            '455166272339181589', // @Elara#1162
            '491635097599082497', // @Elara#2878
            '607752722753519646', // @RoCord#8902
          ].includes(id);
    }
    convertID(id) {
        switch(id) {
            // Dyno
            case "155149108183695360": return "161660517914509312";
            // MEE6
            case "159985870458322944": return "159985415099514880";
            // R. Danny
            case "80528701850124288": return "169293305274826754";
            // Octave
            case "201503408652419073": return "201492375653056512";
            // Tatsumaki/Tatsu
            case "172002275412279296": return "172002255350792192";
            default: return id;
        }
    }
};
