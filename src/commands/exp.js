const Command = require('./command.js')
const Config = require('../config.js')
const { RichEmbed } = require('discord.js')

module.exports = class Experience extends Command
{
	setup(router)
	{
		this.config = Config('exp')
		this.config.users = this.config.users || {}
		this.config.commandEXP = this.config.commandEXP || false
		this.config.messageCooldown = this.config.messageCooldown == undefined ? this.config.messageCooldown : 0 // In seconds, 2 minutes by default

		// exp (global) @user
		//		Shows the amount of experience the user has (total if 'global')
		// e.g. exp @Yuki-Chan
		// e.g. exp global @Yuki-Chan
		router.add(/^exp (global )?@(.*)/i, (params, msg) =>
		{
			let global = params[0] && params[0].toLowerCase().includes('global')
			let discordUser = msg.mentions.users.first()
			let username = msg.guild.member(discordUser).displayName
			if(!this.config.users[discordUser.id])
			{
				msg.channel.send(`${username}${this.randomHonorific()} hasn't spoken on this server yet`)
				return
			}
			let user = this.config.users[discordUser.id]
			let guildID = msg.guild.id
			if(!user.guilds[guildID] || !user.guilds[guildID].exp)
			{
				msg.channel.send(`${username}${this.randomHonorific()} hasn't spoken on this server yet`)
				return
			}
			if(!global)
				msg.channel.send(`${username}${this.randomHonorific()} has ${user.guilds[guildID].exp || 0} EXP and is level ${user.guilds[guildID].lvl || 0}`)
			else
				msg.channel.send(`${username}${this.randomHonorific()} has ${user.globalCount || 0} total EXP`)
		}, { guildsOnly: true })
		// exp global
		//		Shows the amount of experience the sender has globally
		.add(/exp global/i, (params, msg) =>
		{
			if(!this.config.users[msg.author.id])
			{
				msg.channel.send(`You haven't spoken anywhere yet..`)
				return
			}
			msg.channel.send(`${msg.member.displayName}${this.randomHonorific()} has ${this.config.users[msg.author.id] ? this.config.users[msg.author.id].globalCount : 0} total EXP`)
		}, { guildsOnly: true })
		// exp (global) <username>
		//		Shows the amount of experience the user has (total if 'global')
		// e.g. exp Yuki-Chan
		// e.g. exp global Yuki-Chan
		.add(/^exp (global )?(.*)/i, (params, msg) => {
			let global = params[0] && params[0].toLowerCase().includes('global')
			let username = params[1].toLowerCase()
			let discordUser = msg.channel.members.find(x => x.displayName.toLowerCase() == username || x.user.username.toLowerCase() == username)
			if(!discordUser)
			{
				msg.channel.send(`Couldn't find user ${params[0]}`)
				return
			}
			username = discordUser.displayName
			if(!this.config.users[discordUser.id])
			{
				msg.channel.send(`${username}${this.randomHonorific()} hasn't spoken on this server yet`)
				return
			}
			let user = this.config.users[discordUser.id]
			let guildID = msg.guild.id
			if(!user.guilds[guildID] || !user.guilds[guildID].exp)
			{
				msg.channel.send(`${username}${this.randomHonorific()} hasn't spoken on this server yet`)
				return
			}
			if(!global)
				msg.channel.send(`${username}${this.randomHonorific()} has ${user.guilds[guildID].exp || 0} EXP and is level ${user.guilds[guildID].lvl || 0}`)
			else
				msg.channel.send(`${username}${this.randomHonorific()} has ${user.globalCount || 0} total EXP`)
		}, { guildsOnly: true })
		// help exp
		// exp help
		//		Shows available commands for the 'exp' command
		.add(/^(help exp)|(exp help)/i, (params, msg) =>
		{
			msg.channel.send('Experience Help', new RichEmbed()
			.addField('Experience Distribution', `10-30 experience is randomly generated and given for each message sent, with a ${this.config.messageCooldown} second cooldown\n` +
												 'Experience and levels are per-server, but overall experience can be shown with `exp global`')
			.addBlankField()
			.addField('`exp (global) (@user)`', 'Shows the level and experience of the user mentioned (*or sender if none given*) (*overall experience if `global`*)')
			)
		})
		// exp
		//		Shows the level and experience of the user sending the command
		.add(/^exp/i, (params, msg) =>
		{
			if(!this.config.users[msg.author.id])
			{
				msg.channel.send(`You haven't spoken yet`)
				return
			}
			let user = this.config.users[msg.author.id]
			let guildID = msg.guild ? msg.guild.id : msg.channel.id
			if(!user.guilds[guildID] || !user.guilds[guildID].exp)
			{
				msg.channel.send(`You haven't spoken on this server yet`)
				return
			}
			msg.channel.send(`${msg.member ? msg.member.displayName : msg.author.username}${this.randomHonorific()} has ${user.guilds[guildID].exp || 0} EXP and is level ${user.guilds[guildID].lvl || 0}`)
		}, { guildsOnly: true })
	}

	onMessage(message, isCommand)
	{
		if((isCommand && !this.config.commandEXP) || message.channel.type == 'dm' || message.channel.type == 'group')
			return
		// Generate the amount of experience gained (10-30)
		let count = Math.floor(Math.random() * 20 + 10)

		// Get the user from the config file
		let user = this.config.users[message.author.id] ? this.config.users[message.author.id] : {}
		let guildID = message.guild.id

		if(!user.guilds)
			user.guilds = {}
		if(user.guilds[guildID] && user.guilds[guildID].lastMessage && this.config.messageCooldown && (Date.now() - new Date(user.guilds[guildID].lastMessage)) / 1000 < this.config.messageCooldown)
			return // cooldown is still in effect
		user.guilds[guildID].lastMessage = Date.now()

		// Update the total count
		user.globalCount = (user.globalCount || 0) + count
		// Update the count for the current channel
		if(!user.guilds[guildID])
			user.guilds[guildID] = {}
		user.guilds[guildID].exp = (user.guilds[guildID] ? (user.guilds[guildID].exp || 0) : 0) + count

		// Generate points (10-50)
		let cards = require('../index.js').getCommand('cards')
		if(cards)
		{
			let points = Math.floor(Math.random() * 40 + 10)
			cards.addPoints(message.author.id, guildID, points)
		}
		else
			console.log('Couldn\'t find Cards command')

		if(user.guilds[guildID].exp >= ((user.guilds[guildID].lvl || 1) + 1) * 200)
		{
			user.guilds[guildID].lvl = (user.guilds[guildID].lvl || 1) + 1
			message.channel.send(new RichEmbed()
				.setTitle('Level Up!')
				.setDescription(`${message.member ? message.member.displayName : message.author.username}${this.randomHonorific()} leveled up to **level ${user.guilds[guildID].lvl}**`)
				.setImage(message.author.displayAvatarURL)
				.setColor('#7200ff')
				)
		}

		// user.guilds[guildID].lastMessage = Date.now()

		this.config.users[message.author.id] = user
		this.config.save()
	}
}
