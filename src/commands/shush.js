const Command = require('./command.js')
const Config = require('../config.js')
const Index = require('../index.js')
const { RichEmbed } = require('discord.js')

module.exports = class Experience extends Command
{
	setup(router)
	{
		this.config = Config('shush')
		this.config.guilds = this.config.guilds || {}

		// shush|mute <user>
		//		Shows the amount of experience the sender has globally
		router.add(/^(shush|mute|unshush|unmute) @(.*)/i, (params, msg) =>
		{
			let mutedRole = (this.config.guilds[msg.guild.id] = this.config.guilds[msg.guild.id] || -1)
			if(mutedRole <= -1)
			{
				msg.channel.send('No role is set for shushed, please assign one using `mute|shush setrole @role`')
				return
			}

			let role = msg.guild.roles.find(x => x.id == mutedRole)
			if(!role)
			{
				msg.channel.send('Mute role could not be found, try setting it again with `mute|shush setrole @role`')
				return
			}

			let mutedUser = msg.mentions.members.first()
			if(!mutedUser)
			{
				msg.channel.send(`Couldn't find a mentioned user, try \`mute|shush @user\``)
				return
			}

			params[0] = params[0].toLowerCase()
			let mute = params[0] == 'shush' || params[0] == 'mute'
			let isMuted = mutedUser.roles.find(x => x.id == mutedRole)
			if(mute)
			{
				if(isMuted)
				{
					msg.channel.send(`'${mutedUser.displayName}${this.randomHonorific()}' is already muted`)
					return
				}
				mutedUser.addRole(role, 'Muted').catch(console.error)
			}
			else
			{
				if(!isMuted)
				{
					msg.channel.send(`'${mutedUser.displayName}${this.randomHonorific()}' isn't muted`)
					return
				}
				mutedUser.removeRole(role, 'Unmuted').catch(console.error)
			}

			msg.channel.send(`${mutedUser.displayName}${this.randomHonorific()} has been ${mute ? '' : 'un'}muted`)
		}, { guildsOnly: true })
		// shush|mute setrole @role
		//		Assigns a role for anyone that is shushed
		.add(/^(shush|mute) setrole @(.*)/i, (params, msg) =>
		{
			let role = msg.mentions.roles.first()
			if(!role)
			{
				msg.channel.send('No role mentioned, please assign one using `shush setrole @role`')
				return
			}

			this.config.guilds[msg.guild.id] = role.id
			this.config.save()

			msg.channel.send(`Shushed role set as '${role.name}'`)
		}, { guildsOnly: true, adminRequired: true })
		// help exp
		// exp help
		//		Shows available commands for the 'shush'/'mute' commands
		.add(/^(help (shush|unshush|mute|unmute))|((shush|unshush|mute|unmute) help)/i, (params, msg) =>
		{
			let embed = new RichEmbed()

			embed.addField('`shush|mute @user`', 'Mutes the specified user')
				  .addField('`unshush|unmute @user`', 'Unmutes the specified user')

			if(this.isAdmin(msg))
				embed.addField('`shush|mute setrole @role`', 'Sets the role for muted users (**Admin**)')
					 .setFooter('Make sure *Yuki* has a role higher than the muted role in the server settings')

			msg.channel.send('Mute/Shush Help', embed)
		})
	}
}
