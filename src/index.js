const path = require('path')
const Debug = require('./debug.js')
const Config = require('./config.js')
const Router = require('./router.js')
const Command = require('./commands/command.js')
const { Client, RichEmbed } = require('discord.js')
const BasicCommands = require('./commands/basics.js')

let basicCommandIndex = -1

module.exports =
{
	commands: [],
	router: undefined,

	getCommand(name)
	{
		name = name.toLowerCase()
		for(let i = 0; i < module.exports.commands.length; i++)
			if(module.exports.commands[i].constructor.name.toLowerCase() == name)
				return module.exports.commands[i]
		return undefined
	},

	// Make functions (that are easily accessible within commands) global
	getGuild(msg) { return module.exports.commands[0].getGuild(msg) },
	random(array) { return module.exports.commands[0].random(array) },
	randomNotNSFW() { return module.exports.commands[0].randomNotNSFW() },
	randomNotAdmin() { return module.exports.commands[0].randomNotNSFW() },
	randomGuildsOnly() { return module.exports.commands[0].randomGuildsOnly() },
	randomHonorific(connector = '-') { return module.exports.commands[0].randomHonorific(connector) },

	// isAdmin(DiscordMessage)
	//		See BasicCommands.isAdmin(...) (src/commands/basics.js)
	isAdmin(msg) { return basicCommandIndex >= 0 ? module.exports.commands[basicCommandIndex].isAdmin(msg) : false },

	// isNSFW(DiscordMessage)
	//		Checks whether NSFW content is allowed on the current channel
	isNSFW(msg) { return basicCommandIndex >= 0 ? module.exports.commands[basicCommandIndex].isNSFW(msg) : false },

	// useHonorifics(DiscordMessage)
	//		Returns true if the guild config allows honorifics appended to usernames
	useHonorifics(msg) { return basicCommandIndex >= 0 ? module.exports.commands[basicCommandIndex].useHonorifics(msg) : true },

	sendDialogueOptions(msg,
						content,
						options = [],
						dialogueFormat = DefaultDialogueFormat,
						dialogueOptionFormat = DefaultDialogueOptionFormat,
						customFilter = undefined,
						embedColour = undefined
					)
	{ return module.exports.commands[0].sendDialogueOptions(msg, content, options, dialogueFormat, dialogueOptionFormat, customFilter, embedColour) }
}

Debug.setup()

// Load config and check for Discord API Token
let config = Config('yuki-chan')
if(!config.discordToken)
{
	// Default config
	config.defaultCommandToken = '!'
	config.discordToken = '<API_TOKEN>'
	config.clientID = '<CLIENT_ID>'
	config.save()

	Debug.warning('No Discord API token! Please add it to ./config/yuki-chan.json', Debug.levels.HIGH)
	return
}

module.exports.discordClient = new Client()

loadCommands = () =>
{
	Debug.log('\nLoading commands...')
	var normalizedPath = path.join(__dirname, 'commands')
	require('fs').readdirSync(normalizedPath).forEach((file) =>
	{
		if(!file.endsWith('.js') || file.endsWith('command.js'))
			return
		const required = require(`./commands/${file}`)
		try
		{
			let instance = new required()
			if(instance instanceof Command)
			{
				if(instance.setup)
					instance.setup(module.exports.router)
				module.exports.commands.push(instance)
				Debug.log(`Loaded '${file}'`)
			}
			if(instance instanceof BasicCommands)
				basicCommandIndex = module.exports.commands.length - 1 // cache for use later
		} catch (e)
		{
			Debug.error(`\nFailed to load '${file}'`, e)
		}
	})
}

module.exports.discordClient.on('ready', () =>
{
	module.exports.router = new Router()
	loadCommands()
	// Default, if no command was executed
	module.exports.router.add((params, msg) => msg.channel.send('Unknown command, try `help`'))

	Debug.log(`\nYuki Chan ready`, Debug.levels.HIGH, Debug.colours.BRIGHT + Debug.colours.GREEN)
	Debug.log(`\thttps://discordapp.com/oauth2/authorize?client_id=${config.clientID}&scope=bot`, Debug.levels.HIGH, Debug.colours.BRIGHT)
})

checkGuildData = (cmd, guildID, message) =>
{
	let guilds = cmd ? cmd.config.guilds : undefined
	guilds = guilds || {}
	guilds[guildID] = guilds[guildID] || {}
	guilds[guildID].commandToken = guilds[guildID].commandToken || config.defaultCommandToken || '!'

	switch(message.channel.type)
	{
		case 'dm': guilds[guildID].name = `DM_${message.author.username}`; break;
		case 'group': guilds[guildID].name = message.channel.name || `GROUP_${message.channel.id}`; break;
		default: guilds[guildID].name = message.guild.name; break;
	}

	if(cmd && guilds[guildID] != cmd.config.guilds[guildID])
	{
		cmd.config.guilds = guilds
		cmd.config.save()
	}
}

module.exports.discordClient.on('message', message =>
{
	// If the message is from this bot, skip it
	if(message.author.id == module.exports.discordClient.user.id)
		return

	// Swap out iOS quotes with regular ones
	message.content = message.content.replace(/‘|’|“|”/g, '\"')

	let cmd = basicCommandIndex >= 0 ? module.exports.commands[basicCommandIndex] : undefined
	let guildID = message.guild ? message.guild.id : message.channel.id
	checkGuildData(cmd, guildID, message)

	// Check for command token
	let token = cmd.config.guilds[guildID].commandToken
	if(message.content.startsWith(token))
		module.exports.router.check(message, token.length, module.exports.isAdmin(message))
	// Let all commands know we got a message
	for(let i = 0; i < module.exports.commands.length; i++)
		module.exports.commands[i].onMessage(message, message.content.startsWith(token))
})

module.exports.discordClient.on('error', Debug.error)
module.exports.discordClient.login(config.discordToken)
