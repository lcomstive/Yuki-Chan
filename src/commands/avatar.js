const Command = require('./command.js')
const { MessageEmbed, MessageAttachment } = require('discord.js')

const AvatarSize = 2048 // Minimum 16, Maximum 4096. Power of 2 (https://discord.js.org/#/docs/main/master/typedef/ImageURLOptions)

module.exports = class Avatar extends Command
{
	setup(router)
	{
		// 'help avatar', 'avatar help'
		router.add(/^(help avatar)|(avatar help)/i, (params, message) =>
		{
			message.channel.send('Avatar Help', new MessageEmbed()
				.addField('`avatar (@user)`', 'Obtains the image for the mentioned user (*or the sender if none given*)')
			)
		})

		// avatar @<MENTIONED_USER>
		.add(/^avatar @(.*)/i, (params, message) =>
		{
			try
			{
				let user = message.mentions.users.first()
				console.log(`Fetching avatar of '${user.username}'`)
				if(user.avatar)
					message.channel.send(new MessageAttachment(user.avatarURL({ dynamic: true, size: AvatarSize })))
				else
					message.channel.send('User has no avatar...');
			}
			catch(e)
			{
				console.log(`Failed to find '${params[0]}' - ${e}`)
				message.channel.send(`Couldn't find that user? Did you mention them properly?`)
				return
			}
		})

		// avatar <USERNAME>
		.add(/^avatar (.*)/, (params, message) =>
		{
			try
			{
				let username = params[0].toLowerCase()
				let member = message.channel.members.find(x => x.displayName.toLowerCase() == username || x.user.username.toLowerCase() == username)
				if(!member)
				{
					console.log(`Failed to find '${params[0]}'`)
					message.reply(`Couldn't find '${params[0]}', where could they be`)
					return
				}
				console.log(`Fetching avatar of '${member.displayName}'`)
				if(user.avatar)
					message.channel.send(new MessageAttachment(user.avatarURL({ dynamic: true, size: AvatarSize })))
				else
					message.channel.send('User has no avatar...');
			}
			catch(e)
			{
				console.log(`Failed to find '${params[0]}' - ${e}`)
				message.channel.send(`Couldn't find '${params[0]}', where could they be?`)
			}
		})

		// avatar
		.add(/^avatar/i, (params, message) =>
		{
			console.log(`Fetching avatar of '${message.author.username}' (${message.author.avatar})`)
			if(message.author.avatar)
				message.channel.send(new MessageAttachment(message.author.avatarURL({ dynamic: true, size: AvatarSize })))
			else
				message.channel.send('User has no avatar...')
		})
	}
}
