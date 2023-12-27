const Utils = require('../utils.js')
const AssignRole = require('./assignRole.js')
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')

module.exports =
{
	data: new SlashCommandBuilder()
			.setName('new-game-role')
			.setDescription('Creates a new role that can be assigned for ping notifications')
			.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
			.setDMPermission(false) // Don't allow this to be used in direct messages
			.addStringOption(option => option
				.setName('role-name')
				.setDescription('Name of the role')
				.setRequired(true))
			.addBooleanOption(option => option
				.setName('generate-message')
				.setDescription('Generate message for members to assign this role. Defaults to true'))
			.addStringOption(option => option
				.setName('emoji')
				.setDescription('Emoji to use for reaction when `generate-message` is true. Defaults to 👍'))
	,
	async execute(interaction)
	{
		const generateMessage = interaction.options.getBoolean('generate-message') ?? true
		const roleName = interaction.options.getString('role-name')

		let role = interaction.guild.roles.cache.find(role => role.name == roleName)
		if(role != null)
		{
			await interaction.reply({
				content: 'That role already exists, use the `/assign-role` command to create a message that members can react to',
				ephemeral: true
			})
			return
		}

		role = await interaction.guild.roles.create({
			name: roleName,
			reason: 'Generated with Yuki'
		})

		await interaction.reply({
			content: `Created role <@&${role.id}>`,
			ephemeral: true
		})

		if(generateMessage)
		{
			var emoji = interaction.options.getString('emoji') ?? '👍'
			const embed = AssignRole.generateMessage(role)
			
			if(Utils.canUseEmoji(emoji, interaction.guild))
			{
				const msg = await interaction.followUp({ embeds: [embed], fetchReply: true })
				msg.react(emoji)
			}
			else
				interaction.followUp({
					content: 'This bot cannot use that emoji, please use a different one',
					ephemeral: true	
				})
		}
	}
}