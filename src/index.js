module.exports = {
	CommandoClient: require('./client'),
	CommandoRegistry: require('./registry'),
	CommandoGuild: require('./extensions/guild'),
	CommandoMessage: require('./extensions/message'),
	Command: require('./commands/base'),
	CommandGroup: require('./commands/group'),
	ArgumentCollector: require('./commands/collector'),
	Argument: require('./commands/argument'),
	ArgumentType: require('./types/base'),
	Purger: require('./extensions/packages/purger/index')
};