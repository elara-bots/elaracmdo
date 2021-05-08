const { Structures } = require("discord.js");


module.exports = Structures.extend("GuildMember", GuildMember => {
    return class CommandoMember extends GuildMember {
        constructor(client, data, guild) {
            super(client, data, guild);
            this.pending = data.pending ?? false;
        };
    }
})
