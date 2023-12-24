const Debug = require('../debug.js')
const { Events } = require('discord.js')

module.exports =
{
	name: Events.InteractionCreate,
	async execute(interaction)
	{
		if(!interaction.isChatInputCommand()) return

		const command = interaction.client.commands.get(interaction.commandName)

		if(!command)
		{
			Debug.error(`No command matching '${interaction.commandName}' was foudn`)
			return
		}

		try { await command.execute(interaction) }
		catch (error)
		{
			Debug.error(error)

			if(interaction.replied || interaction.defferred)
				await interaction.followUp({ content: 'There was an error while executing this command', ephemeral: true })
			else
				await interaction.reply({ content: 'There was an error while executing this command', ephemeral: true })
		}
	}
}