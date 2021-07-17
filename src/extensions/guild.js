const { Guild } = require("discord.js");

const register = (name, value) => Guild.prototype[name] = value;

for (const name of [ "_commandPrefix", "color" ]) register(name, null);

register("currency", "$");
register("Invites", []);
register("Commands", "");

register("setPrefix", function(thing) {
    this.commandPrefix = thing;
    this._commandPrefix = thing;
    return thing;
});

Reflect.defineProperty(Guild.prototype, "commandPrefix", {
    get: function () {
		if(this._commandPrefix === null) return this.client.commandPrefix;
		return this._commandPrefix;
	},
	set: function (prefix) { this._commandPrefix = prefix; }
});

register("setCommandEnabled", function (command, enabled) {
    command = this.client.registry.resolveCommand(command);
    if(command.guarded) throw new Error(`The command is guarded.`);
    if(typeof enabled === "undefined") throw new TypeError(`Enabled must not be undefined.`);
    enabled = Boolean(enabled);
    if(!this._commandsEnabled) this._commandsEnabled = {};
    this._commandsEnabled[command.name] = enabled;
});

register("isCommandEnabled", function (command) {
    command = this.client.registry.resolveCommand(command);
    if(command.guarded) return true;
    if(!this._commandsEnabled) return command._globalEnabled;
    return this._commandsEnabled[command.name];
});

register("setGroupEnabled", function (group, enabled) {
    group = this.client.registry.resolveGroup(group);
    if(group.guarded) throw new Error(`The group is guarded.`);
    if(typeof enabled === 'undefined') throw new TypeError(`Enabled must not be undefined.`);
    enabled = Boolean(enabled);
    if(!this._groupsEnabled) this._groupsEnabled = {};
    return this._groupsEnabled[group.id] = enabled;
});

register("isGroupEnabled", function (group) {
    group = this.client.registry.resolveGroup(group);
    if(group.guarded) return true;
    if(!this._groupsEnabled) return group._globalEnabled;
    return this._groupsEnabled[group.id];
});

module.exports = Guild;