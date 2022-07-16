const { Message, Util: { escapeMarkdown, splitMessage }, MessageEmbed: Embed } = require("discord.js"),
        blacklist = (message) => {
            if (message.client.registry.block.users.includes(message.author.id)) return true;
            if (!message.guild) return false;
            if (global.config?.ignore?.guilds?.includes(message.guild.id)) return true;
            return false;
        },
        register = (name, value) => Message.prototype[name] = value;

for (const name of [ "command", "argString", "patternMatches", "responses", "responsePositions" ]) register(name, null);

register("initCommand", function(command, argString, patternMatches) {
    this.command = command;
    this.argString = argString;
    this.patternMatches = patternMatches;
    return this;
});

register("del", async function (options = { timeout: 0, reason: "" }) {
    if (typeof options !== "object") options = { timeout: 0, reason: "" };
    const { timeout = 0, reason } = options;
    if (timeout <= 0) return this.channel.messages.delete(this.id, reason).then(() => this);
    return new Promise(r => setTimeout(() => r(this.del({ reason })), timeout))
});

register("parseArgs", function () {
    switch(this.command.argsType) {
        case 'single': return this.argString.trim().replace(this.command.argsSingleQuotes ? /^("|')([^]*)\1$/g : /^(")([^]*)"$/g, '$2');
        case 'multiple': return parseArgs(this.argString, this.command.argsCount, this.command.argsSingleQuotes);
        default: throw new RangeError(`Unknown argsType "${this.argsType}".`);
    }
});

register("inlineReply", async function(content, options) {
    if (!options && typeof content === 'object' && !(content instanceof Array)) { options = content; content = null; }
    if (typeof options !== "object") options = { };
    if (content && typeof content === "string") options.content = content;
    if (options?.reply === true) options.allowedMentions = { ...options.allowedMentions, repliedUser: false };
    delete options["reply"];
    if (options.embed) {
        if (options.embeds) options.embeds.push(options.embed);
        else options.embeds = [ options.embed ];
    }
    return this.channel.send({ ...options, reply: { messageReference: this, failIfNotExists: false } })
    .catch((e) => global.log(`[MESSAGE:INLINE_REPLY:ERROR]: ${global.__filename}`, e));
});

register("boop", async function (options, ...messageOptions){
    let send = { ...messageOptions };
    if (options.content && typeof options.content === "string") send.content = options.content;
    if (options.components && Array.isArray(options.components)) send.components = options.components;
    if (options.embeds && Array.isArray(options.embeds)) send.embeds = options.embeds;
    if (options.embed && typeof options.embed === "object") {
        if (options.embed?.image && typeof options.embed?.image === "string") options.embed.image = { url: options.embed.image };
		if (options.embed?.thumbnail && typeof options.embed?.thumbnail === "string") options.embed.thumbnail = { url: options.embed.thumbnail };
		send.embed = new Embed(options.embed).toJSON();
    }
    if (this.channel.type !== "DM" && !this.channel.permissionsFor(this.client.user).has(global.perms.basic)) return null;
    return this.inlineReply(send.content ?? "", { ...send, reply: true });
});

register("custom", function (content, text = null, options){
    if (text === null) text = undefined;
    if (typeof text === "object") { options = text; text = undefined; }
    if (typeof options === "string") { options = {}; text = options; }
    return this.inlineReply(text || undefined, {
        embeds: [
            {
                title: `INFO`,
                description: content, 
                color: global.util.colors.purple,
                timestamp: new Date(),
                author: { name: this.author.tag, icon_url: this.author.displayAvatarURL({dynamic: true}), url: this.client.options.invite }
            }
        ],
        ...options,
        reply: true
    })
});

register("success", function (content, text, options) { return this.custom(`${global.util.emojis.semoji} ${content}`, text, options); });

register("error", function (content, text, options) { return this.custom(`${global.util.emojis.nemoji} ${content}`, text, options); });

register("run", async function () { // eslint-disable-line complexity
    if (!this.author || this.author.bot || this.webhookID || !this.client || !this.client.user) return;
    let [ owner, support, db ] = [ this.client.isOwner(this.author.id), this.client.isSupport(this.author.id), null ];
    if (blacklist(this) && !support) return;
    if (this.client.registry.maintenance && !support) return this.command.onBlock(this, "maintenance");
    if (this.client.registry.block.commands.includes(this.command.name) && !owner) return this.command.onBlock(this, "GlobalDisable");
    if (this.guild) {
        if (!this.member || !this.guild.members.cache.has(this.author.id)) return;
        if (global.config?.ignore?.guilds?.includes(this.guild.id) && !support) return;
        if (global.dbs?.getSettings) db = await global.dbs.getSettings(this.guild);
    }else {
        if (this.command.guildOnly) return this.command.onBlock(this, "guildOnly");
    }
    const checkPerms = () => {
        if (!this.member.roles.cache.filter(c => c.id !== this.guild.id).size || !db || this.client.isOwner(this.author.id) || !Array.isArray(db.commands)) return false;
        let find = db.commands.find(c => c.name === this.command.name);
        if (!find) return false;
        if (this.member.roles.cache.filter(c => find.roles.includes(c)).size) return true;
        return false; 
    };
    // Ensure the user has permission to use the command
    const hasPermission = this.command.hasPermission(this);
    if (!hasPermission || typeof hasPermission === 'string') {
        let perm = this.guild ? checkPerms() : false;
        if (!perm) return this.command.onBlock(this, 'permission', { 
            response: typeof hasPermission === 'string' ? hasPermission : undefined
        });
    }

    // Ensure the client user has the required permissions
    if (this.guild) {
        if (this.command.clientPermissions) {
            const missing = this.channel.permissionsFor(this.client.user).missing(this.command.clientPermissions);
            if (missing.length) return this.command.onBlock(this, 'clientPermissions', { missing });
        }

        if (this.command.clientGuildPermissions) {
            const missing = this.guild.me.permissions.missing(this.command.clientGuildPermissions);
            if (missing.length) return this.command.onBlock(this, 'clientPermissions', { missing });
        }
    }

    // Throttle the command
    const throttle = this.command.throttle(this.author.id);
    if (throttle && ((throttle.usages + 1) > this.command.throttling.usages)) {
        return this.command.onBlock(this, 'throttling', { throttle, remaining: ((throttle.start + (this.command.throttling.duration * 1000) - Date.now()) / 1000) });
    }

    // Figure out the command arguments
    let [ args, collResult ] = [ this.patternMatches, null ];
    if (!args && this.command.argsCollector) {
        const collArgs = this.command.argsCollector.args,
              count = collArgs[collArgs.length - 1].infinite ? Infinity : collArgs.length,
              provided = parseArgs(this.argString.trim(), count, this.command.argsSingleQuotes);

        collResult = await this.command.argsCollector.obtain(this, provided);
        if (collResult.cancelled) {
            if (!collResult.prompts.length ) return this.error(`Invalid command usage.`);
            if (this.guild && db && db.toggles.prompts && collResult.prompts.length && collResult.answers.length){
                let IDS = [ ...collResult.prompts.map(c => c.id) ];
                if (this.channel.permissionsFor(this.guild.me).has(global.perms.manage.messages)) IDS.push(...collResult.answers.map(c => c.id))
                this.channel.bulkDelete(IDS, true).catch(() => {});
            }
            return this.error(`Command Cancelled`);
        }
        if (this.guild && db && db.toggles.prompts && collResult.prompts.length && collResult.answers.length){
            let IDS = [ ...collResult.prompts.map(c => c.id) ];
            if (this.channel.permissionsFor(this.guild.me).has(global.perms.manage.messages)) IDS.push(...collResult.answers.map(c => c.id))
            this.channel.bulkDelete(IDS, true).catch(() => {});
        }
        args = collResult.values;
    }
    if (!args) args = this.parseArgs();
    const fromPattern = Boolean(this.patternMatches);
    if (throttle) throttle.usages++;
    try {
        const promise = this.command.run(this, args, fromPattern, collResult);
        this.client.emit('commandRun', this.command, this, args);
        return await promise;
    } catch(err) {
        this.client.emit('commandError', this.command, err, this, args, fromPattern, collResult);
        return this.command.onError(err?.message ?? err, this);
    }
});

// Private fields 

register("finalize", function (responses) {
    const deleteRemainingResponses = () => {
        for(const id of Object.keys(this.responses)) {
            const responses = this.responses[id];
            for(let i = this.responsePositions[id] + 1; i < responses.length; i++) {
                const response = responses[i];
                if (response instanceof Array) for(const resp of response) resp.del();
                else response.del();
            }
        }
    };
    if (this.responses) deleteRemainingResponses();
    this.responses = {};
    this.responsePositions = {};

    if (responses instanceof Array) {
        for(const response of responses) {
            const channel = (response instanceof Array ? response[0] : response).channel;
            const id = channel.type === "DM" ? "DM" : channel.id;
            if (!this.responses[id]) {
                this.responses[id] = [];
                this.responsePositions[id] = -1;
            }
            this.responses[id].push(response);
        }
    } else if (responses) {
        const id = responses.channel ? responses.channel.type === "DM" ? "DM" : responses.channel.id : "DM"
        this.responses[id] = [responses];
        this.responsePositions[id] = -1;
    }
});

register("editCurrentResponse", function (id, options) {
    if (typeof this.responses[id] === 'undefined') this.responses[id] = [];
    if (typeof this.responsePositions[id] === 'undefined') this.responsePositions[id] = -1;
    this.responsePositions[id]++;
    const editResponse = (response, { type, content, options }) => {
        if (!response) return this.respond({ type, content, options, fromEdit: true });
        if (options && options.split) content = splitMessage(content, options.split);

        let prepend = '';
        if (type === 'reply') prepend = `${this.author}, `;

        if (content instanceof Array) {
            const promises = [];
            if (response instanceof Array) {
                for(let i = 0; i < content.length; i++) {
                    if (response.length > i) promises.push(response[i].edit({ content: `${prepend}${content[i]}`, ...options }).catch(e => global.log(`[MESSAGE:EDIT:ERROR]: ${global.__filename}`, e)));
                    else promises.push(response[0].channel.send({ content: `${prepend}${content[i]}` }).catch(e => global.log(`[MESSAGE:SEND:ERROR]: ${global.__filename}`, e)));
                }
            } else {
                promises.push(response.edit({ content: `${prepend}${content[0]}`, ...options }).catch(e => global.log(`[MESSAGE:EDIT:ERROR]: ${global.__filename}`, e)));
                for(let i = 1; i < content.length; i++) {
                    promises.push(response.channel.send({ content: `${prepend}${content[i]}` }).catch(e => global.log(`[MESSAGE:SEND:ERROR]: ${global.__filename}`, e)));
                }
            }
            return Promise.all(promises);
        } else {
            if (response instanceof Array) { // eslint-disable-line no-lonely-if
                for(let i = response.length - 1; i > 0; i--) response[i].del().catch(() => null);
                return response[0].edit({ content: `${prepend}${content}`, ...options }).catch(e => global.log(`[MESSAGE:EDIT:ERROR]: ${global.__filename}`, e))
            } else {
                return response.edit({ content: `${prepend}${content}`, ...options }).catch(e => global.log(`[MESSAGE:EDIT:ERROR]: ${global.__filename}`, e))
            }
        }
    };
    return editResponse(this.responses[id][this.responsePositions[id]], options);
});

register("respond", function ({ type = 'reply', content, options, lang, fromEdit = false }) {
    const shouldEdit = this.responses && !fromEdit;
    if (shouldEdit && typeof options?.split !== "object") options.split = {};
    if (type === 'reply' && this.channel.type === 'DM') type = 'plain';
    if (type !== 'direct' && this.guild && !this.channel.permissionsFor(this.client.user).has(global.perms.messages.send)) type = "direct";

    content = typeof content === "string" ? content : null;
    content = content?.replace?.(new RegExp(this.client.token, "g"), "[N/A]");
    switch(type) {
        case 'plain':
            if (!shouldEdit) return this.channel.send({ content, ...options }).catch(e => global.log(`[MESSAGE:RESPOND:ERROR]: ${global.__filename}`, e))
            return this.editCurrentResponse(this.channel.type === "DM" ? "DM" : this.channel.id, { type, content, options });
        case 'reply':
            if (!shouldEdit) return this.channel.send({ content, ...options }).catch(e => global.log(`[MESSAGE:RESPOND:ERROR]: ${global.__filename}`, e))
            if (options && options.split && !options.split.prepend) options.split.prepend = `${this.author}, `;
            return this.editCurrentResponse(this.channel.type === "DM" ? "DM" : this.channel.id, { type, content, options });
        case 'direct':
            if (!shouldEdit) return this.author.send({ content, ...options }).catch(e => global.log(`[MESSAGE:RESPOND:ERROR]: ${global.__filename}`, e))
            return this.editCurrentResponse('DM', { type, content, options });
        case 'code':
            if (!shouldEdit) return this.channel.send({ content, ...options }).catch(e => global.log(`[MESSAGE:RESPOND:ERROR]: ${global.__filename}`, e))
            if (options && options.split) {
                if (!options.split.prepend) options.split.prepend = `\`\`\`${lang || ''}\n`;
                if (!options.split.append) options.split.append = '\n```';
            }
            content = `\`\`\`${lang || ''}\n${escapeMarkdown(content, true)}\n\`\`\``;
            return this.editCurrentResponse(this.channel.type === "DM" ? "DM" : this.channel.id, { type, content, options });
        default:
            throw new RangeError(`Unknown response type "${type}".`);
    }
});

function parseArgs(argString, argCount, allowSingleQuote = true) {
    let [ re, result, match ] = [
        allowSingleQuote ? /\s*(?:("|')([^]*?)\1|(\S+))\s*/g : /\s*(?:(")([^]*?)"|(\S+))\s*/g,
        [], []
    ]
	argCount = argCount || argString.length;
	while(--argCount && (match = re.exec(argString))) result.push(match[2] || match[3]);
	if (match && re.lastIndex < argString.length) {
		const re2 = allowSingleQuote ? /^("|')([^]*)\1$/g : /^(")([^]*)"$/g;
		result.push(argString.substr(re.lastIndex).replace(re2, '$2'));
	}
	return result;
}

module.exports = Message;