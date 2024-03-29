const fs = require('fs')
const path = require('path')
const Debug = require('./debug.js')
const Config = require('./config.js')
const { Client, Collection, GatewayIntentBits, Partials, Events }
	= require('discord.js')

let client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessageReactions
	],
	partials: [ Partials.Message, Partials.Channel, Partials.Reaction ]
})

Debug.setup()

// Load config and check for Discord API Token
let config = Config('yuki-chan')
if(!config.discordToken)
{
	// Default config
	config.discordToken = '<API_TOKEN>'
	config.clientID = '<CLIENT_ID>'
	config.save()

	Debug.warning('No Discord API token! Please add it to ./config/yuki-chan.json', Debug.levels.HIGH)
	return
}

loadCommands = () =>
{
	let count = 0
	client.commands = new Collection()

	var normalizedPath = path.join(__dirname, 'commands')
	fs.readdirSync(normalizedPath)
		.filter(file => file.endsWith('js'))
		.forEach(file =>
		{
			const cmd = require(`./commands/${file}`)
			if('data' in cmd && 'execute' in cmd)
			{
				client.commands.set(cmd.data.name, cmd)
				count++
			}
			else
				Debug.warning(`Command '${file}' is missing either a 'data' or 'execute' property`)
		})
	Debug.log(`Loaded ${count} commands`)
}

loadEvents = () =>
{
	let count = 0
	var normalizedPath = path.join(__dirname, 'events')
	fs.readdirSync(normalizedPath)
		.filter(file => file.endsWith('.js'))
		.forEach(file =>
		{
			const event = require(`./events/${file}`)
			if(event.once)
				client.once(event.name, (...args) => event.execute(...args))
			else
				client.on(event.name, (...args) => event.execute(...args))
			count++
		})
	Debug.log(`Loaded ${count} events`)
}

client.on(Events.MessageReactionAdd, async (reaction, user) =>
{
	// Check if reaction is a partial
	// https://discordjs.guide/popular-topics/partials.html
	if(reaction.partial)
	{
		try { await reaction.fetch() } // Fetch to check if message still exists and wasn't deleted
		catch { return }
	}

	client.commands.forEach(cmd =>
	{
		if('onReaction' in cmd)
			cmd.onReaction(reaction, user, true /* added */)
	})
})
client.on(Events.MessageReactionRemove, async (reaction, user) =>
{
	// Check if reaction is a partial
	// https://discordjs.guide/popular-topics/partials.html
	if(reaction.partial)
	{
		try { await reaction.fetch() } // Fetch to check if message still exists and wasn't deleted
		catch { return }
	}

	client.commands.forEach(cmd =>
	{
		if('onReaction' in cmd)
			cmd.onReaction(reaction, user, false /* added */)
	})
})

loadEvents()
loadCommands()
client.login(config.discordToken)

module.exports = client