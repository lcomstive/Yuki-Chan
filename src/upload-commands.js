const fs = require('fs')
const path = require('path')
const { REST, Routes } = require('discord.js')
const { clientID, discordToken } = require('../config/yuki-chan.json')

const commands = []

console.log('Loading commands...')
var normalizedPath = path.join(__dirname, 'commands')
fs.readdirSync(normalizedPath).forEach((file) =>
{
	if(!file.endsWith('.js')) return

	const cmd = require(`./commands/${file}`)
	if('data' in cmd && 'execute' in cmd)
		commands.push(cmd.data.toJSON())
	else
		console.warn(`Command '${file}' is missing either a 'data' or 'execute' property`)
})
console.log(`Loaded ${commands.length} commands`)

const rest = new REST().setToken(discordToken);

// Push commands to Discord
(async () => {
	try
	{
		console.log('Uploading command list to Discord...')

		const data = await rest.put(
			Routes.applicationCommands(clientID),
			{ body: commands }
		)

		console.log(`Successfully reloaded ${data.length} application commands`)
	}
	catch(error) { console.error(error) }
})()