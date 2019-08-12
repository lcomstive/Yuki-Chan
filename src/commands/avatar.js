const Command = require('./command.js')
const { RichEmbed } = require('discord.js')

module.exports = class Avatar extends Command
{
	setup(router)
	{
		// 'help avatar', 'avatar help'
		router.add(/^(help avatar)|(avatar help)/i, (params, message) =>
		{
			message.channel.send('Avatar Help', new RichEmbed()
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
				message.channel.send({ files: [{ attachment: user.displayAvatarURL, name: `${user.username}_avatar.jpg` }]})
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
				message.channel.send({ files: [{ attachment: member.user.displayAvatarURL, name: `${member.displayName}_avatar.jpg` }]})
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
			console.log(`Fetching avatar of '${message.author.username}'`)
			message.channel.send({ files: [ { attachment: message.author.displayAvatarURL, name: `${message.author.username}_avatar.jpg` } ]})
		})
	}
}
