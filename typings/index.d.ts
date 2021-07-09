declare module 'elaracmdo' {

	// @ts-ignore
	import { Channel, Client, ClientOptions, Collection, DMChannel, Guild, GuildChannel, GuildMember, GuildResolvable, Message, MessageEmbed, MessageOptions, MessageReaction, PermissionResolvable, PermissionString, Role, Snowflake, TextChannel, User, UserResolvable, VoiceState, Invite, GuildEmoji, Speaking, Presence, CloseEvent, ColorResolvable, DeconstructedSnowflake, ThreadChannel, ThreadMember, StageInstance, ApplicationCommand, Interaction, Sticker, MessageComponentOptions, MessageSelectMenuOptions, MessageSelectOptionData } from 'discord.js';
	
	export class Argument {
		private constructor(client: CommandoClient, info: ArgumentInfo);

		private obtainInfinite(msg: CommandoMessage, vals?: string[], promptLimit?: number): Promise<ArgumentResult>;

		private static validateInfo(client: CommandoClient, info: ArgumentInfo);

		public default: any;
		public error: string;
		public infinite: boolean;
		public key: string;
		public label: string;
		public max: number;
		public min: number;
		public oneOf: any[];
		public parser: Function;
		public prompt: string;
		public type: ArgumentType;
		public validator: Function;
		public wait: number;

		public obtain(msg: CommandoMessage, val?: string, promptLimit?: number): Promise<ArgumentResult>;
		public parse(val: string, msg: CommandoMessage): any | Promise<any>;
		public validate(val: string, msg: CommandoMessage): boolean | string | Promise<boolean | string>;
	}
	export class ArgumentCollector {
		public constructor(client: CommandoClient, args: ArgumentInfo[], promptLimit?: number);

		public args: Argument[];
		public readonly client: CommandoClient;
		public promptLimit: number;

		public obtain(msg: CommandoMessage, provided?: any[], promptLimit?: number): Promise<ArgumentCollectorResult>;
	}

	export class ArgumentType {
		public constructor(client: CommandoClient, id: string);

		public readonly client: CommandoClient;
		public id: string;

		public parse(val: string, msg: CommandoMessage, arg: Argument): any | Promise<any>;
		public validate(val: string, msg: CommandoMessage, arg: Argument): boolean | string | Promise<boolean | string>;
		public isEmpty(val: string, msg: CommandoMessage, arg: Argument): boolean;
	}

	export class ArgumentUnionType extends ArgumentType {
		public types: ArgumentType[];
	}
	
	export type CommandFlags = 'NEW'
	
	export class Command {
		public constructor(client: CommandoClient, info: CommandInfo);

		private _globalEnabled: boolean;
		private _throttles: Map<string, object>;

		private throttle(userID: string): object;

		private static validateInfo(client: CommandoClient, info: CommandInfo);
		public readonly client: CommandoClient;
		public name: string;
		public aliases: string[];
		public flags: CommandFlags[]|string[];
		public argsCount: number;
		public argsSingleQuotes: boolean;
		public argsType: string;
		public clientPermissions: PermissionResolvable[];
		public userGuildPermissions: PermissionResolvable[];
		public clientGuildPermissions: PermissionResolvable[];
		public defaultHandling: boolean;
		public description: string;
		public details: string;
		public examples: string[];
		public format: string;
		public group: CommandGroup;
		public groupID: string;
		public guarded: boolean;
		public hidden: boolean;
		public ownerOnly: boolean;
		public guildOnly: boolean;
		public dmOnly: boolean;
		public nsfw: boolean;
		public patterns: RegExp[];
		public throttling: ThrottlingOptions;
		public userPermissions: PermissionResolvable[];

		public hasPermission(message: CommandoMessage): boolean | string;
		public isEnabledIn(guild: GuildResolvable, bypassGroup?: boolean): boolean;
		public isUsable(message: CommandoMessage): boolean;
		public onBlock(message: CommandoMessage, reason: string, data?: Object): Promise<Message | Message[]>;
		public onBlock(message: CommandoMessage, reason: 'guildOnly' | 'nsfw'): Promise<Message | Message[]>;
		public onBlock(message: CommandoMessage, reason: 'permission', data: { response?: string }): Promise<Message | Message[]>;
		public onBlock(message: CommandoMessage, reason: 'clientPermissions', data: { missing: string }): Promise<Message | Message[]>;
		public onBlock(message: CommandoMessage, reason: 'throttling', data: { throttle: Object, remaining: number }): Promise<Message | Message[]>;
		public onError(err: Error, message: CommandoMessage, args: object | string | string[], fromPattern: false): Promise<Message | Message[]>;
		public onError(err: Error, message: CommandoMessage, args: string[], fromPattern: true): Promise<Message | Message[]>;
		public run(message: CommandoMessage, args: object | string | string[], fromPattern: boolean): Promise<Message | Message[] | null> | null;
		public setEnabledIn(guild: GuildResolvable, enabled: boolean): void;
		public usage(argString?: string, prefix?: string, user?: User): string;

		public static usage(command: string, prefix?: string, user?: User): string;
	}
	export class CommandDispatcher {
		public constructor(client: CommandoClient, registry: CommandoRegistry);

		private _awaiting: Set<string>;
		private _commandPatterns: object;
		private _results: Map<string, CommandoMessage>;

		private buildCommandPattern(prefix: string): RegExp;
		private cacheCommandoMessage(message: CommandoMessage, oldMessage: CommandoMessage, cmdMsg: CommandoMessage, responses: CommandoMessage | CommandoMessage[]): void;
		private handleMessage(messge: CommandoMessage, oldMessage?: CommandoMessage): Promise<void>;
		private inhibit(cmdMsg: CommandoMessage): Inhibition;
		private matchDefault(message: CommandoMessage, pattern: RegExp, commandNameIndex: number): CommandoMessage;
		private parseMessage(message: CommandoMessage): CommandoMessage;
		private shouldHandleMessage(message: CommandoMessage, oldMessage?: CommandoMessage): boolean;

		public readonly client: CommandoClient;
		public inhibitors: Set<Function>;
		public registry: CommandoRegistry;

		public addInhibitor(inhibitor: Inhibitor): boolean;
		public removeInhibitor(inhibitor: Inhibitor): boolean;
	}
	export class CommandGroup {
		public constructor(client: CommandoClient, id: string, name?: string, guarded?: boolean, commands?: Command[]);

		public readonly client: CommandoClient;
		public commands: Collection<string, Command>
		public guarded: boolean;
		public id: string;
		public name: string;

		public isEnabledIn(guild: GuildResolvable): boolean;
		public setEnabledIn(guild: GuildResolvable, enabled: boolean): void;
	}

	export class CommandoMessage extends Message {
		public constructor(message: Message, command?: Command, argString?: string, patternMatches?: string[]);
		private editCurrentResponse(id: string, options?: {}): Promise<CommandoMessage | CommandoMessage[]>;
		private finalize(responses: CommandoMessage | CommandoMessage[]): void;
		private respond(options?: {}): CommandoMessage | CommandoMessage[];
		public  typing(timeout?: number): boolean;

		public argString: string;
		public readonly client: CommandoClient;
		public command: Command|null;
		public readonly guild: CommandoGuild;
		public message: CommandoMessage;
		public patternMatches: string[];
		public responsePositions: {};
		public responses: {};
		public del(options?: {timeout?: number, reason?: string}): Promise<CommandoMessage>;
		public success(content: string, text: string, options: MessageOptions): Promise<CommandoMessage | CommandoMessage[]>;
		public error(content: string, text: string, options: MessageOptions): Promise<CommandoMessage | CommandoMessage[]>;
		public custom(content: string, text: string, options: MessageOptions): Promise<CommandoMessage | CommandoMessage[]>;
		public boop(options: SayOptions, message_options: MessageOptions): Promise<CommandoMessage|CommandoMessage[]>;
		public parseArgs(): string | string[];
		public static parseArgs(argString: string, argCount?: number, allowSingleQuote?: boolean): string[];
		public run(): Promise<CommandoMessage | CommandoMessage[]>;
	}
	export type UserSchema = {
		userTag: string;
		userID: string;
		todos: string[];
		reminders: string[];
		time: string;
		counts: { boops: number; tokens: number; battles: { wins: number, loses: number }; };
		custom: { image: string; description: string; };
		afk: { enabled: boolean; time: string; message: string; };
		optout: { boops: boolean };
		links: { instagram: string; twitter: string; github: string; gitlab: string; twitch: string; youtube: string; discord: string; reddit: string; };
	};
	export type ConfigSchema = {
		guildName: string;
		guildID: string;
		warnings: { case: number; id: string; user: string; mid: string; mod: string; reason: string; date: Date|string; appealed: boolean; }[],
		commands: string[];
		mutes: { guild: string, userID: string, time: string, ms: number, roles: string[], mutedrole: string, created: string, nodm: boolean }[];
		tags: { id: string, content: string }[];
		assignroles: { id: string; requires: string; }[];
		codes: { id: string; max: number; amount: number; users: string[] }[];
		starboard: { id: string, msg: string, channel: string }[];
	};
	export type SettingsSchema = {
		guildName: string;
		guildID: string;
		prefix: string;
		misc: {
			throws: string[];
			jobs: string[];
			crime: { success: string[]; failed: string[]; };
			currency: string;
			color: string;
			commands: string[];
			coins: boolean;
			days: number
		},
		roles: { muted: string; },
		channels: {
			log: { all: string; user: string; server: string; invites: string; mod: string; joins: string; messages: string; commands: string; };
			reports: string;
			vclogs: string;
			action: string;
			appeals: string;
			commands: string;
			ignore: string[];
			nickrequests: string;
		};
		toggles: {
			user: boolean;
			mod: boolean;
			messages: boolean;
			server: boolean;
			joins: boolean;
			invites: boolean;
			logbots: boolean;
			prompts: boolean;
			dmNicknames: boolean;
		};
		suggestions: {
			channels: { channel: string, emojis: string[] }[];
			anonymous: boolean;
			ignore: { command: string; auto: string[]; };
		};
		welcome: { channel: string; role: string[]; bots: string[]; msg: string; };
		leaves: { channel: string; msg: string;
		};
		starboard: {
			enabled: boolean;
			channel: string;
			count: number;
			ignore: { channels: string[]; users: string[]; roles: string[]; };
		};
		ignore: { commands: string[]; logs: { all: string[]; messages: string[]; user: string[]; }; };
		messages: { mute: string; unmute: string; kick: string; ban: string; unban: string; softban: string; };
		events: { name: string, id: string, color: number, disabled: boolean }[];
		commands: { name: string, roles: string[] }[];
	};
	export type DevSchema = {
		clientID: string;
		clientTag: string;
		logging: { status: string; server: string; };
		misc: { disabled: string[]; maintenance: boolean; cooldown: string[]; };
		leaves: { id: string; name: string; logs: { date: string; mod: string; reason: string; }[] }[]
	};
	export class CacheSystem {
		public users: Collection<Snowflake, UserSchema>;
		public config: Collection<Snowflake, ConfigSchema>;
		public settings: Collection<Snowflake, SettingsSchema>;
		public dev: Collection<Snowflake, DevSchema>;
		public has(type: string, key: Snowflake): boolean;
		public set(type: string, key: Snowflake, data: UserSchema|ConfigSchema|SettingsSchema|DevSchema): boolean;
		public update(type: string, key: Snowflake, data: UserSchema|ConfigSchema|SettingsSchema|DevSchema): boolean;
		public remove(type: string, key: Snowflake): boolean; 
	}

	export class WebhookCore {
		public constructor();
		private config: ConfigFile;
		private roles: object;
		private hooks: object;
		
		public status(embeds: MessageEmbed[], content?: string): Promise<CommandoMessage>;
		public error(embeds: MessageEmbed[], content?: string): Promise<CommandoMessage>;
		public events(embeds: MessageEmbed[], content?: string): Promise<CommandoMessage>;
		public commands(embeds: MessageEmbed[], content?: string): Promise<CommandoMessage>;
		public slash(embeds: MessageEmbed[], content?: string): Promise<CommandoMessage>;
		public webhook(embeds: MessageEmbed[], content?: string): Promise<CommandoMessage>;
		private send(url: string, pingRole: string, embeds: MessageEmbed[], content?: string): Promise<CommandoMessage>;
	}

	export class CommandoClient extends Client {
		public constructor(options?: CommandoClientOptions);

		private _commandPrefix: string;
		private setup(): Promise<void>;
		public queue: {
		   	add(channelID: string, webhook: string, guild: CommandoGuild, opts: { content?: string|null, embeds?: MessageEmbed[], webhook: { name?: string|null, icon: string|null } }): Promise<void>;
		   	run_queue(): Promise<void>;
			send(id: string, token: string, options: { guild: CommandoGuild, embeds: MessageEmbed[], username: string, avatarURL: string, channel: string }): Promise<void>;
		};
		public cache: CacheSystem;
		public commandPrefix: string;
		public dispatcher: CommandDispatcher;
		public options: CommandoClientOptions;
		public readonly owners: User[];
		public readonly support: User[];
		public GlobalUsers: string[];
		public GlobalCmds: string[];
		public getColor(guild: CommandoGuild): string;
		public getPrefix(guild: CommandoGuild): string;
		public messages: MessageService;
		public stats: StatsTypes;
		public main: boolean;
		public chunk(array: string|string[], sliceAt: number): string[];
		public registry: CommandoRegistry;
		public say(message: CommandoMessage|Channel|User, options: SayOptions, message_options: MessageOptions): void;
		public config: ConfigFile;
		public f: FunctionsList;
		public services: ServicesList;
		public isOwner(user: UserResolvable): boolean;
		public isSupport(user: UserResolvable): boolean;
		public fetchMessages(channel: TextChannel, limit?: number, before?: string, after?: string, around?: string): Promise<CommandoMessage[]>;
		public deleteMessages(channel: TextChannel, messageIDs: string[]): Promise<string[]>;
		public purgeChannel(channelID: Snowflake, limit: number, filter?: Function|string, before?: Snowflake, after?: Snowflake): Promise<Number>;
		public slash: {
			client: CommandoClient,
			commands: Collection<string, object>;
			load(dirs: string[]): void;
			run(data: object): Promise<void>;
			console(title: string, args: any): void;
		};

		on(event: string, listener: Function): this;
		on(event: "database", listener: (client: CommandoClient, name: string, data: string[], color: string, create: boolean) => void): this;
		on(event: 'commandError', listener: (command: Command, err: Error, message: CommandoMessage, args: object | string | string[], fromPattern: false) => void): this;
		on(event: 'commandError', listener: (command: Command, err: Error, message: CommandoMessage, args: string[], fromPattern: true) => void): this;
		on(event: 'commandRun', listener: (command: Command, promise: Promise<any>, message: CommandoMessage, args: object | string | string[], fromPattern: boolean) => void): this;


		// Discord.js Events 

		on(event: 'interaction', listener: (interaction: Interaction) => void): this;
		on(event: 'applicationCommandCreate', listener: (command: ApplicationCommand) => void): this;
		on(event: 'applicationCommandDelete', listener: (command: ApplicationCommand) => void): this;
		on(event: 'applicationCommandUpdate', listener: (oldCommand: ApplicationCommand, newCommand: ApplicationCommand) => void): this;

		on(event: 'channelCreate', listener: (channel: DMChannel|GuildChannel) => void): this;
		on(event: 'channelDelete', listener: (channel: DMChannel|GuildChannel) => void): this;
		on(event: 'channelUpdate', listener: (oldChannel: DMChannel|GuildChannel, newChannel: DMChannel|GuildChannel) => void): this;
		on(event: 'channelPinsUpdate', listener: (channel: DMChannel|GuildChannel, time: Date) => void): this;

		on(event: 'debug', listener: (info: string) => void): this;
		on(event: 'error', listener: (error: Error) => void): this;
	
		on(event: 'emojiCreate', listener: (emoji: GuildEmoji) => void): this;
		on(event: 'emojiDelete', listener: (emoji: GuildEmoji) => void): this;
		on(event: 'emojiUpdate', listener: (oldEmoji: GuildEmoji, newEmoji: GuildEmoji) => void): this;
	

		on(event: 'guildBanAdd', listener: (guild: CommandoGuild, user: User) => void): this;
		on(event: 'guildBanRemove', listener: (guild: CommandoGuild, user: User) => void): this;
		on(event: 'guildCreate', listener: (guild: CommandoGuild) => void): this;
		on(event: 'guildDelete', listener: (guild: CommandoGuild) => void): this;
		on(event: 'guildIntegrationsUpdate', listener: (guild: CommandoGuild) => void): this;

		on(event: 'guildMemberAdd', listener: (member: GuildMember) => void): this;

		on(event: 'guildMemberRemove', listener: (member: GuildMember) => void): this;
		on(event: 'guildMembersChunk', listener: (members: Collection<Snowflake, GuildMember>, guild: CommandoGuild, chunk: {index: number, count: number, nonce: string}) => void): this;

		on(event: 'guildMemberSpeaking', listener: (member: GuildMember, speaking: Readonly<Speaking>) => void): this;

		on(event: 'guildMemberUpdate', listener: (oldMember: GuildMember, newMember: GuildMember) => void): this;

		on(event: 'guildUnavailable', listener: (guild: CommandoGuild) => void): this;
		on(event: 'guildUpdate', listener: (oldGuild: CommandoGuild, newGuild: CommandoGuild) => void): this;

		on(event: 'threadCreate', listener: (channel: ThreadChannel) => void): this;
		on(event: 'threadDelete', listener: (channel: ThreadChannel) => void): this;
		on(event: 'threadUpdate', listener: (oldChannel: ThreadChannel, newChannel: ThreadChannel) => void): this;
		on(event: 'threadMemberUpdate', listener: (oldMember: ThreadMember, newMember: ThreadMember) => void): this;
		on(event: 'threadMembersUpdate', listener: (oldMembers: Collection<Snowflake, ThreadMember>, newMembers: Collection<Snowflake, ThreadMember>) => void): this;
		on(event: 'threadListSync', listener: (threads: Collection<Snowflake, ThreadChannel>) => void): this;

		on(event: 'stageInstanceCreate', listener: (stage: StageInstance) => void): this;
		on(event: 'stageInstanceDelete', listener: (stage: StageInstance) => void): this;
		on(event: 'stageInstanceUpdate', listener: (oldStage: StageInstance, newState: StageInstance) => void): this;



		on(event: 'messageCreate', listener: (message: CommandoMessage) => void): this;
		on(event: 'messageDelete', listener: (message: CommandoMessage) => void): this;
		on(event: 'messageDeleteBulk', listener: (messages: Collection<Snowflake, CommandoMessage>) => void): this;
		on(event: 'messageUpdate', listener: (oldMessage: CommandoMessage, newMessage: CommandoMessage) => void): this;
		on(event: 'messageReactionAdd', listener: (reaction: MessageReaction, user: User) => void): this;
		on(event: 'messageReactionRemove', listener: (reaction: MessageReaction, user: User) => void): this;
		on(event: 'messageReactionRemoveAll', listener: (message: CommandoMessage) => void): this;
		on(event: 'messageReactionRemoveEmoji', listener: (reaction: MessageReaction) => void): this;



		on(event: 'presenceUpdate', listener: (oldPresence: Presence, newPresence: Presence) => void): this;
		on(event: 'ready', listener: () => void): this;
		on(event: 'rateLimit', listener: (options: {timeout: number, limit: number, method: string, path: string, route: string}) => void): this;

		// Shards
		on(event: 'shardReady', listener: (id: number, unavailableGuilds: Set<string>) => void): this;
		on(event: 'shardResume', listener: (id: number, replayedEvents: number) => void): this;
		on(event: 'shardReconnecting', listener: (id: number) => void): this;
		on(event: 'shardDisconnect', listener: (event: CloseEvent, id: number) => void): this;
		on(event: 'shardError', listener: (error: Error, shardID: number) => void): this;


		on(event: 'roleCreate', listener: (role: Role) => void): this;
		on(event: 'roleDelete', listener: (role: Role) => void): this;
		on(event: 'roleUpdate', listener: (oldRole: Role, newRole: Role) => void): this;
		on(event: 'inviteCreate', listener: (invite: Invite) => void): this;
		on(event: 'inviteDelete', listener: (invite: Invite) => void): this;
		on(event: 'userUpdate', listener: (oldUser: User, newUser: User) => void): this;
		on(event: 'voiceStateUpdate', listener: (oldState: VoiceState, newState: VoiceState) => void): this;
		on(event: 'warn', listener: (info: string) => void): this;
		on(event: 'webhookUpdate', listener: (channel: TextChannel) => void): this;

		on(event: 'stickerCreate', listener: (sticker: Sticker) => void): this;
		on(event: 'stickerDelete', listener: (sticker: Sticker) => void): this;
		on(event: 'stickerUpdate', listener: (sticker: Sticker) => void): this;
	}
	export type MessageDB = {
		id: string;
		type: string;
		guildID: string;
		channelID: string;
		author: string;
		content: string;
		attachments: string[];
		stickers: string[],
		createdAt: Date;
		expire: Date;
	}
	export type MessageDBData = {
		ids: { message: string, user: string, guild: string, channel: string },
		type: string,
		content: string,
		timestamp: Date,
		attachments: string[],
		stickers: string[];
	}
	export class MessageService {
		public constructor(client: CommandoClient);
		public getDB(): Promise<MessageDB[]>;
		public add(data: MessageDBData): Promise<string>;
		public update(content: string, messageID: string, channelID: string): Promise<MessageDB>;
		public delete(messageID: string): Promise<string|null>;
		public get(messageID: string): Promise<MessageDB>;
		public getBulk(messageIDs: string[], shouldDelete: boolean): Promise<MessageDB[]>;
		public count(guildID?: string): Promise<number>;
		public removeGuildMessages(guildID: string): Promise<MessageDB[]>;
		public removeAllMessages(dryRun?: boolean): Promise<MessageDB[]>;
		public findAndRemoveExpired(dryRun?: boolean): Promise<number>;
		public formatMessage(data: MessageDBData): Promise<MessageDB>;
	}
	export class ConfigFile{
		public clientOptions: CommandoClientOptions;
		public look: string;
		private token: string;
		private webhooks: object;
		public user: { name: string, icon: string };
		public ignore: { guilds: string[], users: string[], allowed: string[], voting: string[], cooldown: string[]; };
		public apis: {
			paladins: { devID: string, key: string },
			IMDB: string,
			fortnite: string,
			giphy: string,
			twitch: string,
			youtube: string,
			lists: object
		};
		public roles: {
			unhandled: { rejection: string, exeption: string },
			errors: { commands: string, logger: string, events: string, webhook: string, slash: string }
		};
		public misc: {
			prefix: string,
			owners: string[],
			support: string[],
			invite: string,
			logs: boolean,
			disable: boolean,
			caching: boolean,
			locked: boolean,
			webhooks: boolean,
			messages: boolean,
			debug: boolean,
			express: boolean,
			commandfolders: string[],
			commandGroups: string[],
			website: { url: string, cdn: string, services: string, api: string, stats: string, admin: string };
		}
		private api(num: number): string;
		private g(id: string, name: string, guarded?: boolean): string[];
	}	
	export class Purger {
		public constructor(channel: TextChannel, amount?: number, cmd?: boolean);
		public readonly channel: TextChannel;
		public readonly amount: number;
		public readonly cmd: boolean;
		public links(amount?: number): Promise<number>;
		public bots(amount?: number): Promise<number>;
		public images(amount?: number): Promise<number>;
		public text(amount?: number): Promise<number>;
		public embeds(amount?: number): Promise<number>;
		public client(amount?: number): Promise<number>;
		public invites(amount?: number): Promise<number>;
		public user(user: User, amount?: number): Promise<number>;
		public normal(amount?: number): Promise<number>;
		public init(filter?: string, user?: User|null): Promise<number>;
		public purge(filter: Function, amount: number): Promise<number|null>;
		public fetch(): Promise<CommandoMessage[]>;
	}
	export class FunctionsList {
		public snowflake(id: Snowflake): DeconstructedSnowflake;
		
		public misc: {
			bin(title: string, args: string, ext: string, bin: 'mine' | 'mine-f' | 'haste' | 'pizza' | string): Promise<string|null>;
			mention(client: CommandoClient, args: string): Promise<User|null>;
			role(guild: CommandoGuild, id: string): Promise<Role|null>;
			channel(client: CommandoClient, id: string): Promise<Channel|null>;
			member(guild: CommandoGuild, args: string, fetch: boolean): Promise<GuildMember|null>;
			coinsCheck(guild: CommandoGuild): Promise<boolean>;
		};
		
		public developer: {
			Format(amount: number): string;
			Enabled(boolean: boolean): string;
			shards(id: number, event: string, color: string, footer: { text: string, icon_url: string }|string, error: string): Promise<void>;
		};
		
		public embed(message: CommandoMessage, options: {
			title: string,
			timestamp: string,
			description: string,
			color: string,
			image: string,
			thumbnail: string,
			fields: { name: string, value: string, inline: boolean }[],
			author: {
				name: string,
				icon_url: string;
				url: string;
			},
			footer: {
				text: string,
				icon_url: string
			}
		}): Promise<void>;

		public errors: {
			event(client: CommandoClient, event: string, error: string, guild: CommandoGuild): Promise<void>;
		};
		public getMessage(guild: CommandoGuild, type: string, user: User, def: string): Promise<string>;
		public getTimeLeft(date: Date, type: string): boolean;
		public getTimeRemaining(date: Date, type: string): string;
		public time(date?: Date, discordFormat?: boolean, format?: 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R'): string;
		public getMessage(guild: CommandoGuild, type: string, user: User, def: string): Promise<string|null>;
		public ms(ms: number, long: boolean): string;
		public isBooster(client: CommandoClient, userID: string): boolean;
		public proper(name: string): string;
		public convertMS(seconds: number): string;
		public button(options: ButtonOptionsCustom): ButtonOptions;
		public dropdown(options: DropdownCustom): MessageSelectOptionData;
	}

	export type DropdownCustom = {
		id: string;
		holder?: string;
		min?: number;
		max?: number;
		type?: number;
		options: MessageSelectMenuOptions[]
	};

	export type ButtonOptions = {
		custom_id: string;
		style: number;
		type: number;
		label: string;
		emoji?: { name?: string, id?: string, animated?: boolean };
		disabled?: boolean;
		url?: string;
	}
	
	type ButtonStyles = 'PRIMARY' | 'BLURPLE' | 'SECONDARY' | 'GREY' | 'SUCCESS' | 'GREEN' | 'DANGER' | 'RED' | 'LINK' | 'URL'

	export type ButtonOptionsCustom = {
		id: string;
		style: ButtonStyles|number;
		type: number;
		title: string;
		disabled?: boolean;
		url?: string;
		emoji?: { name?: string, id?: string, animated?: boolean }
	}
	
	export class ServicesList{
		public support: string;
		public docs: string;
		public ping(): Promise<object>;
		public paste: {
			get(id: string): Promise<object>;
			post(title: string, content: string, privatePaste: boolean): Promise<object>;
		};
		public haste: {
			get(id: string, url: string): Promise<object>;
			post(content: string, options: {url: string, extension: string}): Promise<object>;
		};
		public api: {
			dbl: {
				get(token: string, id: string): Promise<object>;
				post(token: string, id: string, servers: number, shards: number): Promise<object>;
			},
			photos(image: string): Promise<object>;
			math(problem: string): Promise<object>;
			special(image: string): Promise<object>;
			translate(toLang: string, text: string): Promise<object>;
			invites(type: string): Promise<object>;
			facts(type: string): Promise<object>;
			memes(clean: boolean): Promise<object>;
			ball(): Promise<object>;
			dogbreed(type: string, breed: string): Promise<object>;
			npm(name: string): Promise<object>;
			time(place: string, all: boolean): Promise<object>;
			docs(search: string, project: string, branch: string): Promise<object>;
			platform: {
				ytstats(token: string, IDOrName: string): Promise<object>;
				twitch(token: string, name: string): Promise<object>;
				roblox(id: string): Promise<object>;
				robloxgroup(id: string): Promise<object>;
				fortnite(token: string, name: string, platform: string): Promise<object>;
				paladins(devID: string, auth: string, username: string, platform: string): Promise<object>;
				imdb(token: string, show: string): Promise<object>;
				ytsearch(token: string, name: string, type: string): Promise<object>;
				picarto(nameOrID: string): Promise<object>;
			}
		};
		public automod: {
			images(token: string, urls: string[], percent: number): Promise<object>;
			words(message: string, filteredWords: string[], filterEmojis: string[]): Promise<object>;
			links(message: string): Promise<object>;
		};
		public dev: {
			blacklists: {
				servers(id: string, type: string, data: {name: string, reason: string, mod: string}): Promise<object>;
				users(id: string, type: string, data: {username: string, tag: string, reason: string, mod: string}): Promise<object>;
			}
		}
	}
	export { CommandoClient as Client };
	export class CommandoGuild extends Guild {
		private _commandPrefix: string;
		private _commandsEnabled: object;
		private _groupsEnabled: object;
		public readonly client: CommandoClient;
		
		public Invites: string[];
		public commandPrefix: string;
		public Commands: string;
		public color: string;
		public currency: string;

		public getPrefix(): string;
		public setPrefix(prefix: string): void;

		public isCommandEndabled(command: CommandResolvable): boolean;
		public isGroupEnabled(group: CommandGroupResolvable): boolean;
		public setCommandEnabled(command: CommandResolvable, enabled: boolean): void;
		public setGroupEnabled(group: CommandGroupResolvable, enabled: boolean): void;
	}
	export class CommandoRegistry {
		public constructor(client?: CommandoClient);

		public readonly client: CommandoClient;
		public commands: Collection<string, Command>;
		public commandsPath: string;
		public evalObjects: object;
		public groups: Collection<string, CommandGroup>;
		public types: Collection<string, ArgumentType>;

		public findCommands(searchString?: string, exact?: boolean, message?: CommandoMessage): Command[];
		public findGroups(searchString?: string, exact?: boolean): CommandGroup[];
		public registerCommand(command: Command | Function): CommandoRegistry;
		public registerCommands(commands: Command[] | Function[], ignoreInvalid?: boolean): CommandoRegistry;
		public registerCommandsIn(options: string | {}): CommandoRegistry;
		public registerDefaultCommands(commands?: { prefix?: boolean, eval?: boolean, ping?: boolean, commandState?: boolean }): CommandoRegistry;
		public registerDefaultGroups(): CommandoRegistry;
		public registerDefaultTypes(types?: { string?: boolean, integer?: boolean, float?: boolean, boolean?: boolean, user?: boolean, member?: boolean, role?: boolean, channel?: boolean, message?: boolean, command?: boolean, group?: boolean, duration?: boolean }): CommandoRegistry;
		public registerEvalObject(key: string, obj: {}): CommandoRegistry;
		public registerEvalObjects(obj: {}): CommandoRegistry;
		public registerGroup(group: CommandGroup | Function | { id: string, name?: string, guarded?: boolean } | string, name?: string, guarded?: boolean): CommandoRegistry;
		public registerGroups(groups: CommandGroup[] | Function[] | { id: string, name?: string, guarded?: boolean }[] | string[][]): CommandoRegistry;
		public registerType(type: ArgumentType | Function): CommandoRegistry;
		public registerTypes(type: ArgumentType[] | Function[], ignoreInvalid?: boolean): CommandoRegistry;
		public registerTypesIn(options: string | {}): CommandoRegistry;
		public resolveCommand(command: CommandResolvable): Command;
		public resolveGroup(group: CommandGroupResolvable): CommandGroup;
	}


	export class RichDisplay {
		public embedTemplate: object;
		public pages: string[];
		public infoPage: string|object;
		public footered: boolean;
		public footerPrefix: string;
		public emojis: {
			first: string,
			back: string,
			forward: string,
			last: string,
			info: string,
			stop: string
		};
		public template(): object;
		public setFooterPrefix(prefix: string): void;
		public addPage(callback: (embed: MessageEmbed) => void): void;
		public run(message: CommandoMessage, options: {
			filter(reaction: MessageReaction, user: User): Function;
			stop: string;
			firstLast: string;
			startPage: number;

		}): Promise<void>;
	}
	export class RichMenu{
		public paginated: boolean;
		public options: string[];
		public addOption(name: string, value: string, inline: boolean): void;
		public run(message: CommandoMessage, options: object): Promise<void>;
	}
	export class util {
		public static disambiguation(items: any[], label: string, property?: string): string;
	}

	type ArgumentCollectorResult<T = object> = {
		values: T | null;
		cancelled?: 'user' | 'time' | 'promptLimit';
		prompts: CommandoMessage[];
		answers: CommandoMessage[];
	};
	type ArgumentInfo = {
		key: string;
		label?: string;
		prompt: string;
		error?: string;
		type?: string;
		max?: number;
		min?: number;
		oneOf?: any[];
		default?: any | Function;
		infinite?: boolean;
		validate?: Function;
		parse?: Function;
		isEmpty?: Function;
		wait?: number;
	};

	type ArgumentResult = {
		value: any | any[];
		cancelled?: 'user' | 'time' | 'promptLimit';
		prompts: CommandoMessage[];
		answers: CommandoMessage[];
	};

	type CommandGroupResolvable = CommandGroup | string;

	type CommandInfo = {
		name: string;
		aliases?: string[];
		autoAliases?: boolean;
		group: string;
		description: string;
		format?: string;
		details?: string;
		examples?: string[];
		nsfw?: boolean;
		guildOnly?: boolean;
		dmOnly: boolean;
		ownerOnly?: boolean;
		clientPermissions?: PermissionResolvable[];
		userPermissions?: PermissionResolvable[];
		userGuildPermissions: PermissionResolvable[];
		clientGuildPermissions: PermissionResolvable[];
		defaultHandling?: boolean;
		throttling?: ThrottlingOptions;
		args?: ArgumentInfo[];
		argsPromptLimit?: number;
		argsType?: string;
		argsCount?: number;
		argsSingleQuotes?: boolean;
		patterns?: RegExp[];
		guarded?: boolean;
		hidden?: boolean;
	};
	type CommandoClientOptions = ClientOptions & {
		commandPrefix?: string;
		commandEditableDuration?: number;
		nonCommandEditable?: boolean;
		owner?: string | string[] | Set<string>;
		support?: string | string[] | Set<string>; 
		invite?: string;
	};

	type CommandResolvable = Command | string;
	type StatsTypes = {
		self: CommandoClient;
		url: string;
		token: string;
		
		commands(message: CommandoMessage): number | string;
		starts(): number | string;
		vote(): number | string;
		shutdowns(): number | string;
		events(): number | string;
		webhooks(): number | string;
		messages(): number | string;
		guilds(joins: boolean): number | string;
		
		client(type: string): Promise<number | string>;
		guild(options: { guildID: string, name: string }): Promise<number | string>;
		
		getClient(id: string): Promise<object>;
		getClients(): Promise<{ status: boolean; data: ClientResponseData[] }[]>;

		getGuild(guildID: string, clientID: string): Promise<object>;
		getGuilds(id: string): Promise<{ status: boolean; data: GuildResponseData[] }[]>;
		
		post(url): Promise<number | string>;
		get(url): Promise<object>;
	}

	type ClientResponseData = {
		clientID: string;
		_id: string;
		__v: number;
		counts: {
			guilds: {
				joins: number;
				leaves: number;
			},
			lists: {
				dbl: number;
				del: number;
				dboats: number;
				dbots: number;
				bfd: number;
				topgg: number;
			},
			votes: number;
			messages: number;
			events: number;
			webhooks: number;
			commands: number;
			starts: number;
			shutdowns: number;
			restarts: number;
		}
	}

	type GuildResponseData = {
		clientID: string;
		guildID: string;
		uses: number;
		date: string;
		_id: string;
		commands: CommandData[];
	}
	type CommandData = {
		_id: string;
		name: string;
		date: string;
		use: number;
	}

	type Inhibitor = (message: CommandoMessage) => false | string | Inhibition;
	type Inhibition = {
		reason: string;
		response?: Promise<Message>;
	}

	type ThrottlingOptions = {
		usages: number;
		duration: number;
	}
	export type SayOptions = {
		content?: string|null;
		embeds?: MessageEmbed[];
		components?: MessageComponentOptions[];
		embed?: {
			title: string;
			timestamp: Date|string;
			description: string;
			color: ColorResolvable|string|number;
			image: string;
			thumbnail: string;
			fields: { name: string, value: string, inline: boolean }[];
			author: {
				name: string;
				icon_url: string;
				url: string;
			};
			footer: {
				text: string;
				icon_url: string;
			}
		}
	}
}
