const Command = require('./command.js')
const Config = require('../config.js')
const Debug = require('../debug.js')
const { RichEmbed } = require('discord.js')

module.exports = class BasicCommands extends Command
{
	setup(router)
	{
		this.config = Config('data')
		this.config.nsfwAllowedByDefault = this.config.nsfwAllowedByDefault || true

		this.commandPages =
		[
			{
				aliases: [ 'misc', 'general', 'fun' ],
				content: 'General (*misc, general, fun*)',
				emoji: '🎉',
				callback: (msg, emoji) => msg.channel.send(new RichEmbed()
												.setDescription(`**Yuki-Chan Misc. Commands**`)
												.addField('`avatar (@user)`', 'Obtains the avatar of the user mentioned (*or sender if none*)')
												.addField('`exp (@user)`', 'Shows the level and experience of the user mentioned (*or sender if none*)')
												.addField('`flip (count)`', 'Flips between 1 and 6 coins (*default is 1*)')
												.addField('`owo (global)`', 'Counts the amount of times you\'ve OwO\'d (*across all servers if `global`*)')
												.addField('`shush|mute @user`', 'Mutes the given user')
												.addField('`react <reaction> (@user)`', 'Sends a reaction image (*e.g. hug, slap*)')
												.addField('`roleplay|rp`', 'Initiates roleplay with Yuki-chan')
												)
			},
			{
				aliases: [ 'admin' ],
				content: 'Admin (*admin*)',
				emoji: '💪',
				callback: (msg, emoji) =>
				{
					if(!this.isAdmin(msg))
					{
						msg.channel.send(this.randomNotAdmin())
						return
					}
					msg.channel.send(new RichEmbed()
						 .setDescription(`**Yuki-Chan Admin Commands**`)
						 .addField('`token <token>`', 'Changes the command token required to call commands (*default is `!`*)').addBlankField()
						 .addField('`adminrole <add|remove> "role" "@role"`', 'Adds or removes roles as `admin`, letting the users in said roles to access administrative commands').addBlankField()
						 .addField('`adminrole list`', 'Lists all roles currently set as admin')
					 	 )
				}
			}
		]

		// Add internal commands
		router.add(/^refresh$/i, (params, msg) =>
		{
			Debug.log('Refreshing..', Debug.levels.LOW)
			let commands = require('../index.js').commands
			for(let i = 0; i < commands.length; i++)
				commands[i].refresh()
			require('../index.js').commands = commands
			msg.channel.send(`Refreshed, thanks to Mountain Dew™`)
		}, { adminRequired: true })
		.add(/^token( .{1,4})?/i, (params, msg) =>
		{
			if(!params[0])
			{
				msg.channel.send(`Try \`token <token>\` where <token> is anywhere from 1 to 4 characters (*e.g.* \`token yc!\`)`)
				return
			}
			this.config.guilds[this.getGuild(msg)].commandToken = params[0].substring(1)
			this.config.save()
			msg.channel.send(`Token changed to \`${params[0].substring(1)}\``)
		}, { adminRequired: true })
		// adminrole list
		//		Lists all admin roles on the current guild
		.add(/^adminrole list$/i, (params, msg) =>
		{
			if(msg.channel.type == 'dm' || msg.channel.type == 'group')
			{
				msg.channel.send('That command is only available in guilds (*not group or direct messages*)')
				return
			}
			let roles = this.config.guilds[this.getGuild(msg)].adminRoles || []
			let roleList = `Admin Roles: (\`${roles.length}\`)`
			for(let i = 0; i < roles.length; i++)
				roleList += `\n - ${msg.guild.roles.get(roles[i]).name}`
			msg.channel.send(roleList)
		}, { adminRequired: true }) // adminRequired
		// adminrole <add|remove> "role" "@role"
		//		Adds or removes the given roles as
		.add(/^adminrole (add|remove) (.*)/i, (params, msg) =>
		{
			if(msg.channel.type == 'dm' || msg.channel.type == 'group')
			{
				msg.channel.send('That command is only available in guilds (*not group or direct messages*)')
				return
			}
			if(!params[1] || !params[1].includes('"'))
			{
				msg.channel.send('Format: `adminrole (add|remove) "@role"` (*requires quotes*)')
				return
			}
			let roleMatches = params[1].match(/["'].*?["']/g)
			let guildID = this.getGuild(msg)
			let roleIDs = []
			for(let i = 0; i < roleMatches.length; i++)
			{
				let rawRole = roleMatches[i].substring(1, roleMatches[i].length - 1).toLowerCase()
				// if format '<@&...>' extract the '...'
				if(rawRole.startsWith('<@&'))
					roleIDs.push(rawRole.substring(3, rawRole.length - 1))
				else // otherwise it's the name of the role
				{
					let role = msg.guild.roles.find(x => x.name.toLowerCase() == rawRole)
					if(!role)
					{
						msg.channel.send(`Couldn't find the role '${rawRole}'`)
						continue
					}
					roleIDs.push(role.id)
				}
 			}

			this.config.guilds[guildID].adminRoles = this.config.guilds[guildID].adminRoles || []
			this.config.guilds[guildID].adminRoles = params[0].toLowerCase() == 'add' ?
									this.config.guilds[guildID].adminRoles.concat(roleIDs) :
									this.config.guilds[guildID].adminRoles.filter(x => !roleIDs.includes(x))
			this.config.save()
			msg.channel.send(`${params[0].toLowerCase() == 'add' ? 'Added' : 'Removed'} ${roleIDs.length} admin role${roleIDs.length == 1 ? '' : 's'}`)
		}, {
			adminRequired: true,
			dirtyMessage:  true
		})
		.add(/^help( \w+)?$/i, (params, msg) =>
		{
			if(params[0])
			{
				params[0] = params[0].substring(1) // remove space at front
				for(let i = 0; i < this.commandPages.length; i++)
				{
					if(this.commandPages[i].aliases.includes(params[0].toLowerCase()))
					{
						this.commandPages[i].callback(msg, this.commandPages[i].emoji)
						return true
					}
				}
				return false
			}
			this.sendDialogueOptions(msg,
					`Yuki-Chan Commands: (Token: \`${this.config.guilds[this.getGuild(msg)].commandToken || '!'}\`)`,
					this.commandPages,
					undefined,
					undefined,
					' $EMOJI$ for *$OPTION$*',
					undefined,
					'PURPLE'
					)
		})
	}

	// isAdmin(DiscordMessage)
	//		Checks whether the author of the message is an admin of the guild
	//	Returns:
	//		- True if DMChannel
	//		- True if owner of GroupDMChannel
	//		- True if has admin role in guild
	// 		- False otherwise
	isAdmin(msg)
	{
		switch(msg.channel.type)
		{
			case 'dm': return true // Direct messages
			case 'group': return msg.channel.ownerID == msg.author.id
			default: break
		}
		if(msg.author.id == msg.guild.ownerID)
			return true // Owner of guild
		let guildID = msg.guild.id
		if(this.config.guilds[guildID].adminRoles &&
			this.config.guilds[guildID].adminRoles.filter(x => msg.member.roles.has(x)).length > 0)
			return true
		return false
	}

	// isNSFW(DiscordMessage)
	//		Checks whether NSFW content is allowed on the current channel
	isNSFW(msg)
	{
		let nsfwAllowed = this.config.guilds[this.getGuild(msg)].nsfwAllowed || this.config.nsfwAllowedByDefault
		return nsfwAllowed && (msg.channel.type == 'dm' || msg.channel.type == 'group' || msg.channel.nsfw)
	}

	// useHonorifics(DiscordMessage)
	//		Returns true if the guild config allows honorifics appended to usernames
	useHonorifics(msg) { return this.config.guilds[this.getGuild(msg)].useHonorifics || true }
}
