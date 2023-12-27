const Debug = require('../debug.js')
const { SlashCommandBuilder, ChannelType } = require('discord.js')

module.exports =
{
	data: new SlashCommandBuilder()
			.setName('looking-to-play')
			.setDescription('Let people know you\'re looking for a group to join your game')
			.setDMPermission(false) // Don't allow this to be used in direct messages
			.addStringOption(option => option
				.setName('game-name')
				.setRequired(true)
				.setDescription('Name of the game you\'re playing'))
			.addRoleOption(option =>
				option.setName('role').setDescription("The role that gets pinged"))
			.addChannelOption(option => option
				.setName('channel')
				.setDescription('The voice channel to meet in')
				.addChannelTypes(ChannelType.GuildVoice))
			.addStringOption(option => option
				.setName('additional')
				.setDescription('More information to show in the message'))
	,
	async execute(interaction)
	{
		const gameName = interaction.options.getString('game-name')
		const role = interaction.options.getRole('role')
		const channel = interaction.options.getChannel('channel')
		const additional = interaction.options.getString('additional')

		let allowedMentions = {}
		let content = `<@${interaction.user.id}> is looking to play '${gameName}', ` +
						'react to this message to let them know you\'re interested.\n'

		if(channel) content += `*Meeting in <#${channel.id}>*\n`

		if(additional) content += `\n${additional}\n`

		if(role)
		{
			content += `\n<@&${role.id}>`
			allowedMentions.roles = [ role.id ]
		}
	
		const msg = await interaction.reply({
			content,
			allowedMentions,
			fetchReply: true
		})
		msg.react('👍')
	}
}