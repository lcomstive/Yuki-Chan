const Utils = require('../utils.js')
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js')

const EmbedDescription = 'React to this message give yourself this role'

module.exports =
{
	data: new SlashCommandBuilder()
			.setName('assign-role')
			.setDescription('Creates a prompt that users can react to for adding/removing their own roles')
			.setDMPermission(false) // Don't allow this to be used in direct messages
			.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
			.addRoleOption(option => option
				.setName('role')
				.setRequired(true)
				.setDescription('Role to assign with this message'))
			.addStringOption(option => option
				.setName('emoji')
				.setDescription('Emoji to use for reaction, defaults to 👍')),

	async execute(interaction)
	{
		const role = interaction.options.getRole('role')
		const emoji = interaction.options.getString('emoji') ?? '👍'

		if(!Utils.canUseEmoji(emoji, interaction.guild))
		{
			await interaction.reply({
				content: 'This bot cannot use that emoji, please use a different one',
				ephemeral: true
			})
			return
		}

		const embed = new EmbedBuilder()
			.setTitle(role.name)
			.setColor(role.color)
			.setDescription(EmbedDescription)
		
		const msg = await interaction.reply({ embeds: [embed], fetchReply: true })
		msg.react(emoji)
	},

	generateMessage(role)
	{
		return new EmbedBuilder()
			.setTitle(role.name)
			.setColor(role.color)
			.setDescription(EmbedDescription)
	},

	onReaction(reaction, user, added)
	{
		reaction.message.embeds.forEach(async embed => {
			// Ignore embeds that don't match our description
			if(embed.description != EmbedDescription) return

			// Don't register author's reaction
			if(user.id == reaction.message.author.id) return
			
			let guildMember = await reaction.message.guild.members.fetch(user.id)
			let role = reaction.message.guild.roles.cache.find(role => role.name == embed.title)
			// console.log(`'${guildMember.displayName}' wants to ${added ? "add" : "remove"} role '${embed.title}'`)

			if(added)
				guildMember.roles.add(role)
			else
				guildMember.roles.remove(role)
		});
	}
}