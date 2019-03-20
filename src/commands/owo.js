const Command = require('./command.js')
const Config = require('../config.js')
const index = require('../index.js')

const owoRegex = /owo/gi

module.exports = class OwO extends Command
{
	setup(router)
	{
		this.config = Config('owo')
		this.config.users = this.config.users || {}

		router.add(/^owo\/global/i, (params, msg) =>
		{
			if(!(msg.author.id in this.config.users))
			{
				msg.channel.send(`You haven't OwO'd anywhere yet`)
				return
			}
			msg.channel.send(`${msg.member ? msg.member.displayName : msg.author.username}${this.randomHonorific()}'s count is currently at ${this.config.users[msg.author.id].globalCount}`)
		})
		.add(/^owo/i, (params, msg) =>
		{
			if(!this.config.users[msg.author.id])
			{
				msg.channel.send(`You haven't OwO'd yet`)
				return
			}
			let user = this.config.users[msg.author.id]
			let guildID = msg.guild ? msg.guild.id : msg.channel.id
			if(!user.guilds[guildID])
			{
				msg.channel.send(`You haven't OwO'd on this server yet`)
				return
			}
			msg.channel.send(`${msg.member ? msg.member.displayName : msg.author.username}${this.randomHonorific()}'s count is currently at ${user.guilds[guildID]}`)
		})
	}

	onMessage(message, isCommand)
	{
		if(isCommand)
			return
		// Check for amount of times 'owo' is said
		let count = (message.content.match(owoRegex) || []).length
		if(!count) // if none, exit
			return

		// Get the user from the config file
		let user = this.config.users[message.author.id] || {}

		// Update the total count
		user.globalCount = (user.globalCount || 0) + count
		// Update the count for the current channel
		if(!user.guilds)
			user.guilds = {}
		let guildID = message.guild ? message.guild.id : message.channel.id
		user.guilds[guildID] = (user.guilds[guildID] ? user.guilds[guildID] : 0) + count

		this.config.users[message.author.id] = user
		this.config.save()
	}
}
