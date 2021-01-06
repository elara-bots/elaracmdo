declare module 'elaracmdo' {
	import { Channel, Client, ClientOptions, Collection, DMChannel, Emoji, Guild, GuildChannel, GuildMember, GuildResolvable, Message, MessageAttachment, MessageEmbed, MessageMentions, MessageOptions, MessageReaction, PermissionResolvable, PermissionString, ReactionEmoji, Role, Snowflake, StringResolvable, TextChannel, User, UserResolvable, VoiceState, Webhook, Invite, GuildAuditLogsEntry, EmbedField, GuildEmoji, Speaking, Presence, CloseEvent, ColorResolvable } from 'discord.js';

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

	export class Command {
		public constructor(client: CommandoClient, info: CommandInfo);

		private _globalEnabled: boolean;
		private _throttles: Map<string, object>;

		private throttle(userID: string): object;

		private static validateInfo(client: CommandoClient, info: CommandInfo);
		public readonly client: CommandoClient;
		public name: string;
		public memberName: string;
		public aliases: string[];
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
		public unknown: boolean;
		public userPermissions: PermissionResolvable[];

		public hasPermission(message: CommandoMessage): boolean | string;
		public isEnabledIn(guild: GuildResolvable, bypassGroup?: boolean): boolean;
		public isUsable(message: Message): boolean;
		public onBlock(message: CommandoMessage, reason: string, data?: Object): Promise<Message | Message[]>;
		public onBlock(message: CommandoMessage, reason: 'guildOnly' | 'nsfw'): Promise<Message | Message[]>;
		public onBlock(message: CommandoMessage, reason: 'permission', data: { response?: string }): Promise<Message | Message[]>;
		public onBlock(message: CommandoMessage, reason: 'clientPermissions', data: { missing: string }): Promise<Message | Message[]>;
		public onBlock(message: CommandoMessage, reason: 'throttling', data: { throttle: Object, remaining: number }): Promise<Message | Message[]>;
		public onError(err: Error, message: CommandoMessage, args: object | string | string[], fromPattern: false): Promise<Message | Message[]>;
		public onError(err: Error, message: CommandoMessage, args: string[], fromPattern: true): Promise<Message | Message[]>;
		public reload(): void;
		public run(message: CommandoMessage, args: object | string | string[], fromPattern: boolean): Promise<Message | Message[] | null> | null;
		public setEnabledIn(guild: GuildResolvable, enabled: boolean): void;
		public unload(): void;
		public usage(argString?: string, prefix?: string, user?: User): string;

		public static usage(command: string, prefix?: string, user?: User): string;
	}
	export class CommandDispatcher {
		public constructor(client: CommandoClient, registry: CommandoRegistry);

		private _awaiting: Set<string>;
		private _commandPatterns: object;
		private _results: Map<string, CommandoMessage>;

		private buildCommandPattern(prefix: string): RegExp;
		private cacheCommandoMessage(message: Message, oldMessage: Message, cmdMsg: CommandoMessage, responses: Message | Message[]): void;
		private handleMessage(messge: Message, oldMessage?: Message): Promise<void>;
		private inhibit(cmdMsg: CommandoMessage): Inhibition;
		private matchDefault(message: Message, pattern: RegExp, commandNameIndex: number): CommandoMessage;
		private parseMessage(message: Message): CommandoMessage;
		private shouldHandleMessage(message: Message, oldMessage?: Message): boolean;

		public readonly client: CommandoClient;
		public inhibitors: Set<Function>;
		public registry: CommandoRegistry;

		public addInhibitor(inhibitor: Inhibitor): boolean;
		public removeInhibitor(inhibitor: Inhibitor): boolean;
	}

	export class CommandFormatError extends FriendlyError {
		public constructor(msg: CommandoMessage);
	}

	export class CommandGroup {
		public constructor(client: CommandoClient, id: string, name?: string, guarded?: boolean, commands?: Command[]);

		public readonly client: CommandoClient;
		public commands: Collection<string, Command>
		public guarded: boolean;
		public id: string;
		public name: string;

		public isEnabledIn(guild: GuildResolvable): boolean;
		public reload(): void;
		public setEnabledIn(guild: GuildResolvable, enabled: boolean): void;
	}

	export class CommandoMessage {
		public constructor(message: Message, command?: Command, argString?: string, patternMatches?: string[]);

		private deleteRemainingResponses(): void;
		private editCurrentResponse(id: string, options?: {}): Promise<CommandoMessage | CommandoMessage[]>;
		private editResponse(response: CommandoMessage | CommandoMessage[], options?: {}): Promise<CommandoMessage | CommandoMessage[]>;
		private finalize(responses: CommandoMessage | CommandoMessage[]): void;
		private respond(options?: {}): CommandoMessage | CommandoMessage[];
		public typing(): boolean;

		public argString: string;
		public readonly attachments: Collection<string, MessageAttachment>;
		public readonly author: User;
		public readonly channel: TextChannel | DMChannel;
		public readonly cleanContent: string;
		public readonly client: CommandoClient;
		public command: Command|null;
		public readonly content: string;
		public readonly createdAt: Date;
		public readonly createdTimestamp: number;
		public readonly deletable: boolean;
		public readonly editable: boolean;
		public readonly editedAt: Date;
		public readonly editedTimestamp: number;
		public readonly edits: CommandoMessage[];
		public readonly embeds: MessageEmbed[];
		public readonly guild: CommandoGuild;
		public readonly id: string;
		public readonly member: GuildMember;
		public readonly mentions: MessageMentions;
		public message: CommandoMessage;
		public readonly nonce: string;
		public patternMatches: string[];
		public readonly pinnable: boolean;
		public readonly pinned: boolean;
		public readonly reactions: Collection<string, MessageReaction>;
		public responsePositions: {};
		public responses: {};
		public readonly system: boolean;
		public readonly tts: boolean;
		public readonly webhookID: string;

		public anyUsage(command?: string, prefix?: string, user?: User): string;
		public delete(timeout?: number): Promise<CommandoMessage>;
		public del(options?: {timeout?: number, reason?: string}): Promise<CommandoMessage>;
		public direct(content: StringResolvable, options?: MessageOptions): Promise<CommandoMessage | CommandoMessage[]>;
		public edit(content: StringResolvable): Promise<CommandoMessage>
		public embed(embed: MessageEmbed | {}, content?: StringResolvable, options?: MessageOptions): Promise<Message | CommandoMessage[]>;
		public success(content: string, text: string, options: MessageOptions): Promise<CommandoMessage | CommandoMessage[]>;
		public error(content: string, text: string, options: MessageOptions): Promise<CommandoMessage | CommandoMessage[]>;
		public custom(content: string, text: string, options: MessageOptions): Promise<CommandoMessage | CommandoMessage[]>;
		public boop(options: SayOpt, message_options: MessageOptions): Promise<CommandoMessage|CommandoMessage[]>;
		public fetchWebhook(): Promise<Webhook>;
		public parseArgs(): string | string[];
		public static parseArgs(argString: string, argCount?: number, allowSingleQuote?: boolean): string[];
		public pin(): Promise<CommandoMessage>
		public react(emoji: string | Emoji | ReactionEmoji): Promise<MessageReaction>;
		public reply(content: StringResolvable, options?: MessageOptions): Promise<CommandoMessage | CommandoMessage[]>;
		public run(): Promise<CommandoMessage | CommandoMessage[]>;
		public say(content: StringResolvable, options?: MessageOptions): Promise<CommandoMessage | CommandoMessage[]>;
		public unpin(): Promise<CommandoMessage>;
		public usage(argString?: string, prefix?: string, user?: User): string;
	}
	export type SayOpt = {
		content?: string;
		embed?: {
			author?: {
				name?: string;
				icon_url?: string;
				url?: string;
			};
			title?: string;
			description?: string;
			url?: string;
			color?: ColorResolvable;
			timestamp?: Date|string;
			image?: string;
			thumbnail?: string;
			fields?: EmbedField[];
			footer?: {
				text?: string;
				icon_url?: string;
			}
		}
	}
	type UserSchema = {
		userTag: string;
		userID: string;
		todos: string[];
		reminders: string[];
		time: string;
		counts: {
			boops: number;
		};
		tokens: {
			amount: number;
			boost: {
				enabled: boolean;
				date: string;
			}
		};
		custom: {
			image: string;
			description: string;
		};
		afk: {
			enabled: boolean;
			time: string;
			message: string;
		};
		links: {
			instagram: string;
			twitter: string;
			github: string;
			gitlab: string;
			twitch: string;
			youtube: string;
			discord: string;
			reddit: string;
		}
	};
	type ConfigSchema = {
		guildName: string;
		guildID: string;
		warnings: {
			case: number;
			id: string;
			user: string;
			mid: string;
			mod: string;
			reason: string;
			date: Date|string;
			appealed: boolean;
		}[],
		commands: string[];
		mutes: string[];
		assignroles: {
			id: string;
			requires: string;
		}[];
		codes: {
			id: string;
			max: number;
			amount: number;
			users: Snowflake[]
		}[]
	};
	type SettingsSchema = {
		guildName: string;
		guildID: string;
		prefix: string;
		misc: {
			throws: string[];
			jobs: string[];
			crime: {
				success: string[];
				failed: string[];
			};
			currency: string;
			color: string;
			commands: string[];
			coins: boolean;
		},
		roles: {
			muted: string;
		},
		channels: {
			log: {
				all: string;
				user: string;
				server: string;
				invites: string;
				mod: string;
				joins: string;
				messages: string;
				commands: string;
			};
			reports: string;
			vclogs: string;
			action: string;
			appeals: string;
			commands: string;
			ignore: string[];
		};
		toggles: {
			user: boolean;
			mod: boolean;
			messages: boolean;
			server: boolean;
			joins: boolean;
			invites: boolean;
			logbots: boolean;
		};
		suggestions: {
			channel: string;
			ignore: {
				command: string;
				auto: string[];
			};
			reactions: {
				one: string;
				two: string;
			}
		};
		welcome: {
			channel: string;
			role: string;
			bots: string;
			msg: string;
		};
		leaves: {
			channel: string;
			msg: string;
		};
		starboard: {
			enabled: boolean;
			channel: string;
			count: number;
			ignore: {
				channels: string[];
				users: string[];
				roles: string[]
			};
		};
		ignore: {
			commands: string[];
			logs: {
				all: string[];
				messages: string[];
				user: string[];
			}
		};
		messages: {
			mute: string;
			unmute: string;
			kick: string;
			ban: string;
			unban: string;
			softban: string;
		}
	};
	type DevSchema = {
		clientID: string;
		clientTag: string;
		logging: {
			status: string;
			server: string;
		};
		misc: {
			disabled: string[];
			maintenance: boolean;
			cooldown: string[];
		};
		dms: {
			enabled: boolean;
			hook: string;
		};
		cmdlog: {
			enabled: boolean;
			hook: string;
		};
		leaves: {
			id: string;
			name: string;
			logs: {
				date: string;
				mod: string;
				reason: string;
			}[]
		}[]
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
		public config: ConfigFile;
		public roles: object;
		public hooks: object;
		
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
		public cache: CacheSystem;
		public webhook: WebhookCore;
		public commandPrefix: string;
		public dispatcher: CommandDispatcher;
		public options: CommandoClientOptions;
		public readonly owners: User[];
		public readonly support: User[];
		public GlobalUsers: string[];
		public GlobalCmds: string[];
		public getColor(guild: CommandoGuild): string;
		public getPrefix(guild: CommandoGuild): string;
		public handleEvent: object;
		public messages: MessageService;
		public stats: StatsTypes;
		public main: boolean;
		public registry: CommandoRegistry;
		public util: ElaraUtil;
		public say(message: CommandoMessage|Channel|User, options: SayOptions, message_options: MessageOptions): void;
		public logger(client: CommandoClient, message: CommandoMessage, error: string, shard: number): Promise<void>;
		public config: ConfigFile;
		public f: FunctionsList;
		public services: ServicesList;
		public isOwner(user: UserResolvable): boolean;
		public isSupport(user: UserResolvable): boolean;

		on(event: string, listener: Function): this;
		on(event: "database", listener: (client: CommandoClient, name: string, data: string[], color: string, create: boolean) => void): this;
		on(event: 'commandError', listener: (command: Command, err: Error, message: CommandoMessage, args: object | string | string[], fromPattern: false) => void): this;
		on(event: 'commandError', listener: (command: Command, err: Error, message: CommandoMessage, args: string[], fromPattern: true) => void): this;
		on(event: 'commandRun', listener: (command: Command, promise: Promise<any>, message: CommandoMessage, args: object | string | string[], fromPattern: boolean) => void): this;


		// Discord.js Events 
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


		on(event: 'message', listener: (message: CommandoMessage) => void): this;
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
	}
	type MessageDB = {
		id: string;
		type: string;
		guildID: string;
		channelID: string;
		author: string;
		content: string;
		attachments: string[];
		createdAt: Date;
		expire: Date;
	}
	type MessageDBData = {
		ids: {
			message: string,
			user: string,
			guild: string,
			channel: string
		},
		type: string,
		content: string,
		timestamp: Date,
		attachments: string[]
	}
	export class MessageService {
		public constructor(client: CommandoClient);
		public getDB(): Promise<MessageDB[]>
		public add(data: MessageDBData): Promise<string>;
		public update(content: string, messageID: string, channelID: string): Promise<MessageDB>;
		public delete(messageID: string): Promise<string|null>;
		public get(messageID: string): Promise<MessageDB>;
		public getBulk(messageIDs: string[], shouldDelete: boolean): Promise<MessageDB[]>;
		public count(): Promise<number>;
		public removeGuildMessages(guildID: string): Promise<MessageDB[]>;
		public removeAllMessages(dryRun: boolean): Promise<MessageDB[]>;
		public findAndRemoveExpired(dryRun: boolean): Promise<number>;
		public formatMessage(data: MessageDBData): Promise<MessageDB>;
	}
	type WeatherOptions = {
		timeout: number;
		lang: string;
		degreeType: string;
		search: string;
	}
	export class Weather {
		public find(options: WeatherOptions, callback: Function): void;
	}
	export class ConfigFile{
		public getWebhooks: string[];
		public getAPI: string[];
		public ignore: {
			guilds: string[];
			users: string[];
			dms: string[];
		};
		public apis: {
			paladins: {
				devID: string;
				key: string;
			},
			IMDB: string;
			hastebin: string;
			api: string;
			fortnite: string;
			giphy: string;
			twitch: string;
			youtube: string;
			lists: {
				dbl: string;
				dboats: string;
				dbots: string;
				del: string;
				bfd: string;
				dblist: string;
			}
		}
		public presence: {
			random: {
				enabled: boolean;
				list: string[];
			},
			default: {
				enabled: boolean;
				def(client: CommandoClient): Promise<void>;
			}
		};
		public user: {
			name: string;
			icon: string;
		}
		public webhooks: {
			audit: string;
			mentions: string;
			log: string;
			error: string;
			servers: string; 
			action: string; 
			feedback: string;
			database: string;
		};
		public misc: {
			owners: string[];
			prefix: string;
			logs: boolean;
			disable: boolean;
			dms: boolean;
			VIP: string[];
			website: {
				url: string;
				cdn: string;
				services: string;
				admin: string;
				normal: string;
				api: string;
				votePass: string;
			};
			commandfolders: string[];
			commandGroups: string[]; 
		};
		public links: {
			dblpro: string;
			github: string;
			invite: string;
			web: {
				feedback: string;
			}
		};
		public roles: {
			unhandled: {
				rejection: string;
				exeption: string;
			},
			errors: {
				commands: string;
				logger: string;
				events: string;
			}
		};
		public getPrefix(ID: string): string;
		public api(num: number): string;
		public webhook(num: number): string;
		public group(id: string, name: string, guarded: boolean): string[];
		public lists(num: number): string;
		public clientOptions: ClientOptions;
		public token: string;
		public mongo: string;
		public botConnected: boolean; 
		public rexexp(str: string): string;
	}
	export class FunctionsList{
		public perms(c: Channel, m: GuildMember, p: PermissionResolvable[]): boolean;
		
		public create(type: string, args: CommandoGuild|User|CommandoClient|string, user: User|CommandoClient|string): Promise<void>;
		
		public delete(type: string, args: CommandoGuild|User|CommandoClient|string, user: User|CommandoClient|string): Promise<void>;
		
		public invite(client: CommandoClient, guild: CommandoGuild, cache: boolean): Promise<string>;
		
		public reason(client: CommandoClient, guild: CommandoGuild, setting: string, reason: string): Promise<void>;
		
		public logbots(client: CommandoClient, guild: CommandoGuild, user: User): Promise<boolean>;
		
		public ignore(client: CommandoClient, guild: CommandoGuild, channel: Channel): Promise<boolean>;
		
		public maint(client: CommandoClient): boolean;
		public audit(guild: CommandoGuild, type: string, all: boolean): Promise<GuildAuditLogsEntry>;
	
		public connect(url: string): Promise<void>;
		public message: {
			commands(client: CommandoClient, message: CommandoMessage): Promise<void>;
			main(client: CommandoClient, message: CommandoMessage): Promise<void>;
			pings(client: CommandoClient, message: CommandoMessage): Promise<void>;
			back(client: CommandoClient, message: CommandoMessage): Promise<void>;
			coins(client: CommandoClient, message: CommandoMessage): Promise<void>;
			dms(client: CommandoClient, message: CommandoMessage): Promise<void>;
		};
		public misc: {
			bin(title: string, args: string, ext: string, bin: string): Promise<void>;
			mention(client: CommandoClient, args: string): Promise<User>;
			role(guild: CommandoGuild, id: string): Promise<Role|null>;
			channel(client: CommandoClient, id: string): Promise<Channel|null>;
			member(guild: CommandoGuild, args: string): Promise<GuildMember|null>;
			coins(msg: Message): void;
			coinsCheck(guild: CommandoGuild): Promise<boolean>;
		};
		public developer: {
			stats(client: CommandoClient, type: string, options: {name: string, msg: string, args: string}): Promise<void>;
			Format(amount: number): string;
			Enabled(boolean: boolean): string;
			shards(id: number, event: string, color: string, footer: string, error: string): Promise<void>;
			userdb(client: CommandoClient, user: User): Promise<void>;
			coinsEnabled(guild: CommandoGuild): Promise<void>; 
		};
		public embed(message: CommandoMessage, options: {
			title: string,
			timestamp: string,
			description: string,
			color: string,
			image: string,
			thumbnail: string,
			fields: string[],
			author: {
				name: string,
				icon_url: string
			},
			footer: {
				text: string,
				icon_url: string
			}
		}): Promise<void>;
		public starting(client: CommandoClient): Promise<void>;
		public errors: {
			commandError(client: CommandoClient, cmd: string, message: CommandoMessage, error: string, args: string): Promise<void>;
			error(msg: CommandoMessage, error: string, valid: string[], del: boolean, options: {thumbnail: string, image: string}): Promise<void>;
			logger(client: CommandoClient, message: CommandoMessage, error: string, shard: number): Promise<void>;
			event(client: CommandoClient, event: string, error: string, guild: CommandoGuild): Promise<void>;
			webhook(client: CommandoClient, reason: string, guild: CommandoGuild, payload: object): Promise<void>;

		};
		public getMessage(guild: CommandoGuild, type: string, user: User, def: string): Promise<string>;
		public getTimeLeft(date: Date, type: string): boolean;
		public getTimeRemaining(date: Date, type: string): number;
		public configService(client: CommandoClient, sconfig: string[]): Promise<void>;
		public userService(client: CommandoClient, susers: string[]): Promise<void>;
		public time(date: Date): string;
		public process(name: string, error: Error, ended: boolean): void|null;

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
				mixer(name: string): Promise<object>;
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
		
		public invites: string[];
		public commandPrefix: string;
		public commands: string;
		public color: string;
		public currency: string;
		
		public getColor(): string;
		public setColor(Color: string): string;
		public getPrefix(): string;
		public setCurrency(thing: string): string;
		public setPrefix(prefix: string): void;


		public commandUsage(command?: string, user?: User): string;
		public isCommandEndabled(command: CommandResolvable): boolean;
		public isGroupEnabled(group: CommandGroupResolvable): boolean;
		public setCommandEnabled(command: CommandResolvable, enabled: boolean): void;
		public setGroupEnabled(group: CommandGroupResolvable, enabled: boolean): void;
	}
	export class ElaraUtil {
		public colors: {
			red: string;
			green: string;
			cyan: string;
			default: string;
			orange: string;
			yellow: string;
		};
		public emojis: {
			sreact: string;
			nreact: string;
			rload: string;
			rplan: string;
			semoji: string;
			eplan: string;
			nemoji: string;
			eload: string;
			robot: string;
			eminus: string;
			rminus: string;
			eplus: string;
			rplus: string;
			rn: string;
			en: string;
			rd: string;
			ed: string;
		};
		public jobs: string[];
		public throws: string[];
		public status: {
			online: string;
			idle: string;
			dnd: string;
			offline: string;
			invisible: string;
		};
		public perms: PermissionResolvable;
		public permbits: object;
		public SystemJoinMessages: string[];
	}
	export class CommandoRegistry {
		public constructor(client?: CommandoClient);

		public readonly client: CommandoClient;
		public commands: Collection<string, Command>;
		public commandsPath: string;
		public evalObjects: object;
		public groups: Collection<string, CommandGroup>;
		public types: Collection<string, ArgumentType>;
		public unknownCommand?: Command;

		public findCommands(searchString?: string, exact?: boolean, message?: Message | CommandoMessage): Command[];
		public findGroups(searchString?: string, exact?: boolean): CommandGroup[];
		public registerCommand(command: Command | Function): CommandoRegistry;
		public registerCommands(commands: Command[] | Function[], ignoreInvalid?: boolean): CommandoRegistry;
		public registerCommandsIn(options: string | {}): CommandoRegistry;
		public registerDefaultCommands(commands?: { help?: boolean, prefix?: boolean, eval?: boolean, ping?: boolean, commandState?: boolean, unknownCommand?: boolean }): CommandoRegistry;
		public registerDefaultGroups(): CommandoRegistry;
		public registerDefaults(): CommandoRegistry;
		public registerDefaultTypes(types?: { string?: boolean, integer?: boolean, float?: boolean, boolean?: boolean, user?: boolean, member?: boolean, role?: boolean, channel?: boolean, message?: boolean, command?: boolean, group?: boolean, duration?: boolean }): CommandoRegistry;
		public registerEvalObject(key: string, obj: {}): CommandoRegistry;
		public registerEvalObjects(obj: {}): CommandoRegistry;
		public registerGroup(group: CommandGroup | Function | { id: string, name?: string, guarded?: boolean } | string, name?: string, guarded?: boolean): CommandoRegistry;
		public registerGroups(groups: CommandGroup[] | Function[] | { id: string, name?: string, guarded?: boolean }[] | string[][]): CommandoRegistry;
		public registerType(type: ArgumentType | Function): CommandoRegistry;
		public registerTypes(type: ArgumentType[] | Function[], ignoreInvalid?: boolean): CommandoRegistry;
		public registerTypesIn(options: string | {}): CommandoRegistry;
		public reregisterCommand(command: Command | Function, oldCommand: Command): void;
		public resolveCommand(command: CommandResolvable): Command;
		public resolveCommandPath(groups: string, memberName: string): string;
		public resolveGroup(group: CommandGroupResolvable): CommandGroup;
		public unregisterCommand(command: Command): void;
	}

	export class FriendlyError extends Error {
		public constructor(message: string);
	}

	export class RichDisplay {
		public embedTemplate: object;
		public pages: string[];
		public infoPage: string|object;
		public footered: boolean;
		public footerPrefix: string;
		public footerSuffix: string;
		public emojis: {
			first: string,
			back: string,
			forward: string,
			last: string,
			info: string,
			stop: string
		};
		public template(): object;
		public setEmojis(emojis: string[]): void;
		public setFooterPrefix(prefix: string): void;
		public setFooterSuffix(suffix: string): void;
		public useCustomFooters(): void;
		public addPage(callback: (embed: MessageEmbed) => void): void;
		public setInfoPage(callback: (embed: MessageEmbed) => void): void;
		public run(message, options: {
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
		public run(message, options: object): Promise<void>;
	}
	export class util {
		public static disambiguation(items: any[], label: string, property?: string): string;
		public static paginate<T>(items: T[], page?: number, pageLength?: number): {
			items: T[],
			page: number,
			maxPage: number,
			pageLength: number
		};
		public static readonly permissions: { [K in PermissionString]: string };
	}
	type MorseResponse = {
		name: string;
		text: string;
	}
	export function Morse(string: string): MorseResponse;
	export const version: string;

	type ArgumentCollectorResult<T = object> = {
		values: T | null;
		cancelled?: 'user' | 'time' | 'promptLimit';
		prompts: Message[];
		answers: Message[];
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
		prompts: Message[];
		answers: Message[];
	};

	type CommandGroupResolvable = CommandGroup | string;

	type CommandInfo = {
		name: string;
		aliases?: string[];
		autoAliases?: boolean;
		group: string;
		memberName: string;
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
		unknown?: boolean;
	};
	type CommandoClientOptions = ClientOptions & {
		commandPrefix?: string;
		commandEditableDuration?: number;
		nonCommandEditable?: boolean;
		owner?: string | string[] | Set<string>;
		support: string | string[] | Set<string>; 
		invite?: string;
		
	};

	type CommandResolvable = Command | string;
	type StatsGuildOptions = {
		guildID: string;
		name: string;
	}
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
		
		client(type: string): number | string;
		guild(options: StatsGuildOptions): number | string;
		
		getClient(id: string): object;
		getClients(): ClientResponse[];

		getGuild(guildID: string, clientID: string): object;
		getGuilds(id: string): GuildResponse[];
		
		post(url): number | string;
		get(url): object;
	}

	type ClientResponse = {
		status: boolean;
		data: ClientResponseData[]
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


	type GuildResponse = {
		status: boolean;
		data: GuildResponseData[]
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

	type Inhibitor = (msg: CommandoMessage) => false | string | Inhibition;
	type Inhibition = {
		reason: string;
		response?: Promise<Message>;
	}

	type ThrottlingOptions = {
		usages: number;
		duration: number;
	}
	type SayOptions = {
		content: string|null;
		embed: {
			title: string;
			timestamp: Date|string;
			description: string;
			color: string;
			image: string;
			thumbnail: string;
			fields: EmbedField[];
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
