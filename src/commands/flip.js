const Command = require('./command.js')
const { RichEmbed } = require('discord.js')

module.exports = class Flip extends Command
{
	setup(router)
	{
		// flip
		//		Flips a coin
		router.add(/^flip$/i, (params, message) =>
		{
			let name = message.member ? message.member.displayName : message.author.username
			message.channel.send(`${name}${this.randomHonorific()} flipped a ${Math.random() >= 0.5 ? 'heads' : 'tails'}`)
		})
		// flip (count)
		//		Flips (count) coins
		router.add(/^flip ((-)?\d+)$/i, (params, message) =>
		{
			let name = message.member ? message.member.displayName : message.author.username
			let count = params[0] ? parseInt(params[0]) : 1
			if(count < 0 || count > 6)
			{
				message.channel.send('You can only flip between 1 and 6 coins')
				return
			}
			let msg = `${name}${this.randomHonorific()} flipped a `
			for(let i = 0; i < count; i++)
				msg += (Math.random() >= 0.5 ? '`heads`' : '`tails`') + (i < count - 1 ? ', ' : '')
			message.channel.send(msg)
		})
		// flip help
		// help flip
		.add(/^(help flip)|(flip help)$/i, (params, message) =>
		{
			message.channel.send('Flip Help', new RichEmbed()
				.addField('`flip (count)`', 'Flips between 1 and 6 coins (*default is 1*)')
			)
		})
	}
}
