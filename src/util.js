const perms = {
	ADMINISTRATOR: 'Administrator',
	VIEW_AUDIT_LOG: 'View Audit Log',
	MANAGE_GUILD: 'Manage Server',
	MANAGE_ROLES: 'Manage Roles',
	MANAGE_CHANNELS: 'Manage Channels',
	VIEW_GUILD_INSIGHTS: 'View Server Insights',
	KICK_MEMBERS: 'Kick Members',
	BAN_MEMBERS: 'Ban Members',
	CREATE_INSTANT_INVITE: 'Create Instant Invite',
	CHANGE_NICKNAME: 'Change Nickname',
	MANAGE_NICKNAMES: 'Manage Nicknames',
	MANAGE_EMOJIS_AND_STICKERS: 'Manage Emojis & Stickers',
	MANAGE_WEBHOOKS: 'Manage Webhooks',
	VIEW_CHANNEL: 'View Channels',
	SEND_MESSAGES: 'Send Messages',
	SEND_TTS_MESSAGES: 'Send TTS Messages',
	MANAGE_MESSAGES: 'Manage Messages',
	EMBED_LINKS: 'Embed Links',
	ATTACH_FILES: 'Attach Files',
	READ_MESSAGE_HISTORY: 'Read Message History',
	MENTION_EVERYONE: 'Mention Everyone',
	USE_EXTERNAL_EMOJIS: 'Use External Emojis & Stickers',
	EXTERNAL_EMOJIS: 'Use External Emojis',
	ADD_REACTIONS: 'Add Reactions',
	CONNECT: 'Connect',
	SPEAK: 'Speak',
	PRIORITY_SPEAKER: 'Priority Speaker',
	MUTE_MEMBERS: 'Mute Members',
	DEAFEN_MEMBERS: 'Deafen Members',
	MOVE_MEMBERS: 'Move Members',
	USE_VAD: 'Use Voice Activity',
	STREAM: "Stream",
	USE_APPLICATION_COMMANDS: "Use Slash Commands",
	REQUEST_TO_SPEAK: "Request To Speak",
	MANAGE_THREADS: "Manage Threads",
	USE_PUBLIC_THREADS: "Use Public Threads",
	USE_PRIVATE_THREADS: "Use Private Threads"
}
module.exports = {
	escapeRegex: str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&'),
	disambiguation: (items, label, property = "name") => `Multiple ${label} found, please be more specific: ${items.map(item => `"${(property ? item[property] : item).replace(/ /g, '\xa0')}"`).join(', ')}`,
	paginate: (items, page = 1, pageLength = 10) => {
		const maxPage = Math.ceil(items.length / pageLength);
		if(page < 1) page = 1;
		if(page > maxPage) page = maxPage;
		const startIndex = (page - 1) * pageLength;
		return { items: items.length > pageLength ? items.slice(startIndex, startIndex + pageLength) : items, page, maxPage, pageLength };
	},
	perms,
	permbits: {
		CREATE_INSTANT_INVITE: 1,
		KICK_MEMBERS: 2,
		BAN_MEMBERS: 4,
		ADMINISTRATOR: 8,
		MANAGE_CHANNELS: 16,
		MANAGE_GUILD: 32,
		ADD_REACTIONS: 64,
		VIEW_AUDIT_LOG: 128,
		PRIORITY_SPEAKER: 256,
		VIEW_CHANNEL: 1024,
		SEND_MESSAGES: 2048,
		SEND_TTS_MESSAGES: 4096,
		MANAGE_MESSAGES: 8192,
		EMBED_LINKS: 16384,
		ATTACH_FILES: 32768,
		READ_MESSAGE_HISTORY: 65536,
		MENTION_EVERYONE: 131072,
		EXTERNAL_EMOJIS: 262144,
		USE_EXTERNAL_EMOJIS: 262144,
		CONNECT: 1048576,
		SPEAK: 2097152,
		MUTE_MEMBERS: 4194304,
		DEAFEN_MEMBERS: 8388608,
		MOVE_MEMBERS: 16777216,
		VIEW_GUILD_INSIGHTS: 524288,
		USE_VAD: 33554432,
		CHANGE_NICKNAME: 67108864,
		MANAGE_NICKNAMES: 134217728,
		MANAGE_ROLES: 268435456,
		MANAGE_WEBHOOKS: 536870912,
		MANAGE_EMOJIS_AND_STICKERS: 1073741824,
		USE_SLASH_COMMANDS: 2147483648,
		REQUEST_TO_SPEAK: 4294967296,
		MANAGE_THREADS: 17179869184,
		USE_PUBLIC_THREADS: 34359738368,
		USE_PRIVATE_THREADS: 68719476736
	},
	emojis: {
    
		// Full Emojis
		semoji: "<a:success:476629550797684736>",
		eplan: "<:Planned:558433500420898846>",
		nemoji: "<a:XX:482868924573155349>",
		eload: "<a:LoadingCat:634127148696862753>",
		robot: "<:Robot:520773153753137162>",
		eminus: "<:minus:552471429199953921>",
		eplus: "<:plus:552471361960804362>",
		en: "<:on:854653108299104256>",
		ed: "<:off:854653108381810688>",
		s: "▫",
		ss: "◽",
		staff: "<:Staff:705088952725668002>",
		dev: "<:ModBadge:847719477298462730>",
		owner: "<:Owner:847770323982221332>",
		info: "<:info:847397714677334066>",
		discord: "<:Discord:847624594717671476>",
	
		// Reactions
		rminus: "552471429199953921",
		rplus: "552471361960804362",
		rn: "854653108299104256",
		rd: "854653108381810688",
		sreact: "476629550797684736",
		nreact: "482868924573155349",
		rload: "634127148696862753",
		rplan: "558433500420898846",
		rinfo: "847397714677334066",
		rdiscord: "847624594717671476"
	},
	colors: {
		red: 0xFF0000,
		green: 0xFF000,
		yellow: 0xFAFF00,
		orange: 0xFF8300,
		cyan: 0x00ffe9,
		purple: 0xb28dff,
		default: 0x36393E
	}
};
