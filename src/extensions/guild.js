const { Structures } = require('discord.js');
const Command = require('../commands/base')

module.exports = Structures.extend('Guild', Guild => {
	/**
	 * A fancier Guild for fancier people.
	 * @extends Guild
	 */
	class CommandoGuild extends Guild {
		constructor(...args) {
			super(...args);
			/**
			 * Internal command prefix for the guild, controlled by the {@link CommandoGuild#commandPrefix}
			 * getter/setter
			 * @name CommandoGuild#_commandPrefix
			 * @type {?string}
			 */
			this._commandPrefix = null;
			/**
			 * Short cut to the guild color
			 * @name CommandoGuild#color
			 * @type {?string}
			 */
			this.color = null;
			/**
			 * Short cut to the guild currency
			 * @name CommandoGuild#currency
			 * @type {string}
			 */
			this.currency = "$";

			/**
			 * Array for the guild invites.
			 * @name CommandoGuild#invites
			 * @type {string[]}
			 */
			this.invites = [];

			/**
			 * The commands channel.. 
			 * @name CommandoGuild#commands
			 * @type {string}
			 */
			this.commands = "";
		}

		/**
		 * @returns {string}
		 */
		getColor(){
			return this.color ?? this.client.util.colors.default;
		};
		/**
		 * @param {string} [color]
		 * @returns {string}
		 */
		setColor(color){
			this.color = color;
			return color;
		};
		setCurrency(thing){
			this.currency = thing;
			return thing;
		};
		setPrefix(thing){
			this.commandPrefix = thing;
			this._commandPrefix = thing;
			return thing;
		};
		/**
		 * Command prefix in the guild. An empty string indicates that there is no prefix, and only mentions will be used.
		 * Setting to `null` means that the prefix from {@link CommandoClient#commandPrefix} will be used instead.
		 * @type {string}
		 */
		get commandPrefix() {
			if(this._commandPrefix === null) return this.client.commandPrefix;
			return this._commandPrefix;
		}

		set commandPrefix(prefix) {
			this._commandPrefix = prefix;
		}

		/**
		 * Sets whether a command is enabled in the guild
		 * @param {CommandResolvable} command - Command to set status of
		 * @param {boolean} enabled - Whether the command should be enabled
		 */
		setCommandEnabled(command, enabled) {
			command = this.client.registry.resolveCommand(command);
			if(command.guarded) throw new Error('The command is guarded.');
			if(typeof enabled === 'undefined') throw new TypeError('Enabled must not be undefined.');
			enabled = Boolean(enabled);
			if(!this._commandsEnabled) {
				/**
				 * Map object of internal command statuses, mapped by command name
				 * @type {Object}
				 * @private
				 */
				this._commandsEnabled = {};
			}
			this._commandsEnabled[command.name] = enabled;
		}

		/**
		 * Checks whether a command is enabled in the guild (does not take the command's group status into account)
		 * @param {CommandResolvable} command - Command to check status of
		 * @return {boolean}
		 */
		isCommandEnabled(command) {
			command = this.client.registry.resolveCommand(command);
			if(command.guarded) return true;
			if(!this._commandsEnabled || typeof this._commandsEnabled[command.name] === 'undefined') return command._globalEnabled;
			return this._commandsEnabled[command.name];
		}

		/**
		 * Sets whether a command group is enabled in the guild
		 * @param {CommandGroupResolvable} group - Group to set status of
		 * @param {boolean} enabled - Whether the group should be enabled
		 */
		setGroupEnabled(group, enabled) {
			group = this.client.registry.resolveGroup(group);
			if(group.guarded) throw new Error('The group is guarded.');
			if(typeof enabled === 'undefined') throw new TypeError('Enabled must not be undefined.');
			enabled = Boolean(enabled);
			if(!this._groupsEnabled) {
				/**
				 * Internal map object of group statuses, mapped by group ID
				 * @type {Object}
				 * @private
				 */
				this._groupsEnabled = {};
			}
			this._groupsEnabled[group.id] = enabled;
		}

		/**
		 * Checks whether a command group is enabled in the guild
		 * @param {CommandGroupResolvable} group - Group to check status of
		 * @return {boolean}
		 */
		isGroupEnabled(group) {
			group = this.client.registry.resolveGroup(group);
			if(group.guarded) return true;
			if(!this._groupsEnabled || typeof this._groupsEnabled[group.id] === 'undefined') return group._globalEnabled;
			return this._groupsEnabled[group.id];
		}

		/**
		 * Creates a command usage string using the guild's prefix
		 * @param {string} [command] - A command + arg string
		 * @param {User} [user=this.client.user] - User to use for the mention command format
		 * @return {string}
		 */
		commandUsage(command, user = this.client.user) {
			return Command.usage(command, this.commandPrefix, user);
		}
	}
	return CommandoGuild;
});
