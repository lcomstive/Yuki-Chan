const { SlashCommandBuilder } = require('discord.js')

module.exports =
{
	data: new SlashCommandBuilder()
			.setName('ping')
			.setDescription('You\'ll never guess the reply you get'),

	async execute(interaction)
	{
		const sent = await interaction.reply({ content: 'Pong!', fetchReply: true })
		interaction.followUp({
			content: `*Bot latency is ${sent.createdTimestamp - interaction.createdTimestamp}ms*`,
			ephemeral: true
		})
	}
}