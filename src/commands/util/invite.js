const { Command } = require('elaracmdo');
module.exports = class NCommand extends Command {
    constructor(client) {
        super(client, {
            name: "invite",
            memberName: "invite",
            aliases: ["botinvite", `inv`, `bot`],
            examples: [`${client.commandPrefix}invite <bot id here>`],
            description: "Gives you a invite for the bot id you provide.",
            group: "info",
            clientPermissions: ["EMBED_LINKS", "SEND_MESSAGES"],
            throttling: Globalcooldown.default,
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
    async run(message, { user}) {
        if(user.bot === false) return message.error(`That is a user account, not a bot..`);
        let p = (name, num) => `[${name}](${this.client.options.http.api.replace("/api", "")}/oauth2/authorize?client_id=${user.id}&permissions=${num}&scope=bot)`,
            links = [
                p("All", "2137517567"),
                p("Administrator", "8"),
                p("Moderator", "1543892167"),
                p("Normal", "67488833"),
                p("None", "0"),
            ]
      let fields = []
      if(this.client.user.equals(user)) fields.push({name: `Support`, value: `[Invite](${this.client.options.invite})`, inline: false});
      return message.boop({
          embed: {
              author: {
                  name: `${user.tag}'s Invite`,
                  icon_url: user.displayAvatarURL({dynamic: true}),
                  url: this.client.user.equals(user) ? this.client.options.invite : undefined
              },
              color: this.client.getColor(message.guild),
              fields: [
                  {
                      name: `Permissions`,
                      value: links.join("\n"),
                      inline: true
                  },
                  ...fields
              ]
          }
      })
    }
}
