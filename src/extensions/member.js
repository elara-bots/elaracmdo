module.exports = require("discord.js").Structures.extend("GuildMember", GM => {
    return class CommandoMember extends GM {
        constructor(client, data, guild) {
            super(client, data, guild);
            this.pending = data.pending ?? false;
        };
    };
});
