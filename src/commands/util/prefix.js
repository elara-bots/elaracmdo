const Command = require("../base");

module.exports = class NCommand extends Command {
    constructor(client) {
        super(client, {
          name: 'prefix',
          aliases: [`setprefix`],
          examples: [
              `${global.PREFIX}prefix`,
              `${global.PREFIX}prefix <new_prefix>`
          ],
          description: 'Checks the prefix',
          group: 'bot',
          guarded: true,
          clientPermissions: global.PERMS.basic,
          throttling: { usage: 3, duration: 10 },
          args: [
              {
                key: 'prefix',
                prompt: 'What do you want the new prefix to be?',
                type: 'string',
                default: '',
                min: 1,
                max: 150
              }
          ]
    });
  }
    async run(message, { prefix }) {
          if(!message.guild) return message.custom(`My prefix is: \`${this.client.commandPrefix}\``);
          let db = await this.client.dbs.getSettings(message.guild);
          if(!db) return message.custom(`My prefix is: \`${message.guild.commandPrefix}\``);
          if(prefix !== '' && !message.member.permissions.has('MANAGE_GUILD')) return message.error(`You need \`Manage Server\` permission to change the prefix for this server.`);
          return this.prefix(message, db, prefix);
    }
    prefix(message, db, change){
        if(!change) return message.custom(`My prefix is: \`${message.guild.commandPrefix}\` or \`@${message.client.user.tag}\``);
        if(['reset', 'clear', 'default', db.prefix].includes(change.toLowerCase())){
          db.prefix = '';
          message.guild.commandPrefix = this.client.commandPrefix;
          message.guild._commandPrefix = this.client.commandPrefix;
          db.save().catch(() => {});
          return message.success(`The prefix is now: \`${message.client.commandPrefix}\` or \`@${message.client.user.tag}\``);
        }
        db.prefix = change.toLowerCase();
        db.save().catch(() => {});
        message.guild.commandPrefix = change.toLowerCase();
        message.guild._commandPrefix = change.toLowerCase();
        return message.success(`The prefix is now: \`${message.guild.commandPrefix}\` or \`@${message.client.user.tag}\``);
    }
};
