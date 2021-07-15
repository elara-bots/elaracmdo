const { DISCORD_INVITE, LINK } = { DISCORD_INVITE: /(discord\.(gg|io|me|li|com)\/.+|discordapp\.com\/invite\/.+|discord\.com\/invite\/.+)/gi, LINK: /http(s)?:\/\//gi  };

module.exports = class Purger {
    /**
     * @param {import("discord.js").TextChannel} channel 
     * @param {number} amount
     * @param {boolean} cmd
     */
    constructor(channel, amount = 1, cmd = false) {
        this.channel = channel;
        this.amount = Number(amount ?? 1);
        this.cmd = Boolean(cmd ?? false);
        this.permissions = [ ...global.PERMS.basic, global.PERMS.manage.messages ];
    }

    /**
    * @param {number} amount 
    */
    links(amount) { return this.purge(m => !m.pinned && !m.content?.match(LINK), amount) }
    /**
    * @param {number} amount 
    */
    bots(amount) { return this.purge(m => !m.pinned && m.author.bot, amount) }
    /**
    * @param {number} amount 
    */
    images(amount) { return this.purge(m => !m.pinned && !m.content?.match(LINK) && !m.attachments.size, amount) }
    /**
    * @param {number} amount 
    */
    text(amount) { return this.purge(m => !m.pinned && !m.attachments.size && !m.embeds.length && !m.content?.match(LINK), amount) }
    /**
    * @param {number} amount 
    */
    embeds(amount) { return this.purge(m => !m.pinned && m.embeds.length !== 0, amount); }
    /**
    * @param {number} amount 
    */
    client(amount) { return this.purge(m => !m.pinned && m.author.bot === m.client.user.id, amount) }
    /**
    * @param {number} amount 
    */
    invites(amount) { return this.purge(m => !m.pinned && m.content?.match(DISCORD_INVITE), amount) }
    /**
     * 
     * @param {import("discord.js").User} user 
     * @param {number} amount 
     */
    user(user, amount) { return this.purge(m => !m.pinned && m.author.id === user.id, amount); }

    normal(amount) { return this.purge(m => !m.pinned, amount) }

    async init(filter, user = null) {
        let amount = this.amount;
        if(amount > 500) amount = 500;
        const f = (reg, name) => {
            if(filter.match(new RegExp(reg, "i"))) filter = name;
        }
        if(this.cmd && this.channel.client.user.equals(user) && ["user", "users", "member", "members"].includes(filter)) filter = "none";

        if(!filter.match(/text|(link|url)(s)?|embed(s)?|(ro)?bot(s)?|image(s)?|photo(s)?|attachment(s)?|you|invite(s)?|user(s)?|member(s)?/i)){
            user = this.channel.client.users.cache.get(filter.replace(/<@!?|>/gi, "")) || await this.channel.client.users.fetch(filter.replace(/<@!?|>/gi, ""), true).catch(() => null);
            if(user) filter = "user"; else filter = "no_filter";
        }
        
        f("member(s)?|user(s)?", "user");
        f("link(s)?|url(s)?", "link");
        f("embed(s)?", "embed");
        f("(ro)?bot(s)?", "bot");
        f("image(s)?|upload(s)?|photo(s)?|attachment(s)?", "image");
        f("invite(s)?", "invite")

        switch(filter){
            case "text": return this.text();
            case "link": return this.links();
            case "embed": return this.embeds();
            case "bot": return this.bots();
            case "image": return this.images();
            case "you": return this.client();
            case "invite": return this.invites();
            case "user": return this.user(user);
            default: return this.normal(amount)
        }
    }

    /**
     * @param {Function} filter 
     * @param {number} amount 
     */

    async purge(filter, amount) {
        let messages = await this.fetch();
        if(!messages) return Promise.resolve(this.cmd ? null : 0);
        if(!amount || amount <= 0) amount = this.amount; 
        return await this.channel.client.deleteMessages(this.channel, messages.filter(filter).map(c => c.id).slice(0, amount))
        .then((m) => this.cmd ? null : m.length)
        .catch(() => this.cmd ? null : 0)
    }

    async fetch() {
        if(!this.channel.permissionsFor(this.channel.client.user.id).has(this.permissions)) return Promise.resolve(null);
        let amount = 0;
        if(this.amount <= 500 && this.amount >= 100) amount = 500;
        else
        if(this.amount <= 100 && this.amount >= 50) amount = 200;
        else amount = 100;
        let messages = await this.channel.client.fetchMessages(this.channel, amount).catch(() => []);
        if(messages.length === 0) return Promise.resolve(null);
        return Promise.resolve(messages)
    }
};
