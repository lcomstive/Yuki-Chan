const Command = require('./command.js')
const Config = require('../config.js')
const Debug = require('../debug.js')
const { RichEmbed } = require('discord.js')

clamp = (value, min, max) => { return Math.min(Math.max(value, min), max) }

module.exports = class Cards extends Command
{
	setup(router)
	{
		this.config = Config('cards')

		/**
		Card Structure
		{
			// Unique Card ID
			"id": "card_id",
			"name": "card_name",
			// URL to Card Image
			"url": "https://www.website.com/image.png",
			// A theme of the card, optional
			"theme": "card_theme",
			// Card Tier
			  - common
			  - uncommon
			  - rare
			  - legendary
			"tier": "common"
		}
		**/
		this.config.cards = this.config.cards || []
		if(this.config.cards.length > 0)
			Debug.log(`Loaded ${this.config.cards.length} cards`, Debug.levels.MED)
		this.config.tiers = this.config.tiers || [
			{
				name: "common",
				cost: 20
			},
			{
				name: "uncommon",
				cost: 50
			},
			{
				name: "rare",
				cost: 100
			},
			{
				name: "legendary",
				cost: 200
			}
		]
		/**
		User Structure
		[
			"user_id": {
				"guilds": [
					"guild_id" : points
				]
			}
		]
		**/
		this.config.users = this.config.users || {}

		// points
		//		Lets user know how many points they have available
		router.add(/^points$/i, (params, message) =>
		{
			let name = message.member.displayName
			let user = this.config.users[message.author.id]
			message.channel.send(`${name}${this.randomHonorific()} has ${user != undefined ? (user.guilds[message.guild.id].points || 0) : 0} points`)
		}, { guildsOnly: true })
		// daily
		//		Adds points to user, can only be used once per day (UTC time)
		.add(/^daily$/i, (params, message) =>
		{
			let name = message.member.displayName
			let user = this.config.users[message.author.id]
			if(!user)
				user = { guilds: {} }
			if(!user.guilds[message.guild.id])
				user.guilds[message.guild.id] = {}
			user = user.guilds[message.guild.id]
			if(!user.daily)
			{
				user.daily =
				{
					consecutiveDays: 0,
					lastDay: -1, // returns 1-31 for day of the month
					lastMonth: -1 // returns 0-11 for the month
				}
			}
			let date = new Date()
			if(user.daily.lastDay == -1 || date.getUTCMonth() > user.daily.lastMonth || (date.getUTCMonth() == user.daily.lastMonth && date.getUTCDay() > user.daily.lastDay))
			{
				let points = Math.floor(Math.random() * 40 + 10) * (user.daily.consecutiveDays > 1 ? user.daily.consecutiveDays : 1)
				this.addPoints(message.author.id, message.guild.id, points)

				let previousDay = new Date()
				previousDay.setDate(previousDay.getDate() - 1)
				if(previousDay.getUTCDay() == user.daily.lastDay && previousDay.getUTCMonth() == user.daily.lastMonth)
					user.daily.consecutiveDays++
				else
					user.daily.consecutiveDays = 1

				user.daily.lastMonth = date.getUTCMonth()
				user.daily.lastDay = date.getUTCDate()
				this.config.users[message.author.id].guilds[message.guild.id] = user
				this.config.save()

				console.log(`ConsecutiveDays: ${user.daily.consecutiveDays}`)
				message.channel.send(`Gained an additional ${points} points`)
			}
			else
				message.channel.send(`You can use \`daily\` only once per day (*UTC time*) (\`last used ${user.daily.lastDay}/${user.daily.lastMonth + 1}\`)`)
		}, { guildsOnly: true })
		// card roll
		//		Rolls for a new card, using available points
		.add(/^card roll$/i, (params, message) =>
		{
			let user = this.config.users[message.author.id]
			let availableCards = []
			for(let i = 0; i < this.config.tiers.length; i++)
			{
				if(this.config.tiers[i].cost > user.guilds[message.guild.id].points)
					continue
				let tierCards = this.config.cards.filter(x => x.tier == undefined ? false :
										isNaN(x.tier) ?
											x.tier.toLowerCase() == this.config.tiers[i].name.toLowerCase() :
											x.tier == i
										)
				for(let j = 0; j < tierCards.length; j++)
					tierCards[j].tierIndex = i
				availableCards.splice(availableCards.length, tierCards.length, ...tierCards)
			}

			let card = undefined
			while(!card)
			{
				if(availableCards.length == 0)
				{
					message.channel.send(`You've retrieved all available cards, try again with more points`)
					return
				}
				let index = Math.floor(Math.random() * availableCards.length)
				card = availableCards[index]
				if(!(user.guilds[message.guild.id].cards || []).find(x => x == card.id))
					break
				availableCards.splice(index, 1)
				card = undefined
			}

			message.channel.send(new RichEmbed()
									.setDescription(`**${message.member.displayName}** got the '*${card.name}*' (\`${card.tier.toUpperCase()}\`)${card.theme ? `(\`${card.theme}\`)` : ''}`)
									.setImage(card.url)
								)
			if(!this.config.users[message.author.id].guilds[message.guild.id].cards)
				this.config.users[message.author.id].guilds[message.guild.id].cards = []
			this.config.users[message.author.id].guilds[message.guild.id].points -= this.config.tiers[card.tierIndex].cost
			this.config.users[message.author.id].guilds[message.guild.id].cards.push(card.id)
			this.config.save()
		})
		/*
		.add(/^card list( (\d|\w+))?/i, (params, message) =>
		{
			params.splice(0, 1)
			let user = this.config.users[message.author.id]
			let pageIndex = isNaN(params[0]) ? 0 : (params[0] ? parseInt(params[0]) : 0)
			let cards = (params[0] && isNaN(params[0])) ?
							user.guilds[message.guild.id].cards.filter(x =>
									(x.theme || '').toLowerCase().includes(params[0].toLowerCase()) ||
									x.name.toLowerCase().includes(params[0].toLowerCase()))
							: user.guilds[message.guild.id].cards
			let msg = `*${message.member.displayName}'s Cards:* ${params[0] ? (isNaN(params[0]) ? `[${params[0].toUpperCase()}]` : `[${params[0]}/${Math.ceil(cards / 6) - 1}]`) : ''}\n`
			for(let i = pageIndex * 6; i < (pageIndex + 1) * 6; i++)
			{
				if(i > cards.length - 1)
					break
				let card = this.config.cards.find(x => x.id == cards[i])
				msg += ` [**\`${i}\`**]`
				msg += ` *${card.name}*  `
				msg += `[\`${card.tier.toUpperCase()}\`]`
				msg += card.theme ? `[\`${card.theme.toUpperCase()}\`]` : ''
				msg += '\n'
			}
			message.channel.send(msg)
		})
		*/
		/*
		.add(/^card recycle (/d)/i, (message, params) =>
		{

		})
		*/
		// cards help
		// help cards
		// help points
		.add(/^(help (cards|points))|(cards help)$/i, (params, message) =>
		{
			message.channel.send('Cards Help', new RichEmbed()
				.addField('`points`', 'Lets you know how many points you have (*gained from talking, like `exp`*)')
				.addField('`daily`', 'Redeeming your daily reward increases each consecutive day')
			)
		})
	}

	addPoints(memberID, guildID, amount)
	{
		let user = this.config.users[memberID] || {}
		if(!user.guilds)
			user.guilds = {}
		if(!user.guilds[guildID])
			user.guilds[guildID] = { points: 0, cards: []}
		user.guilds[guildID].points = (user.guilds[guildID].points || 0) + amount

		this.config.users[memberID] = user
		this.config.save()
	}

	removePoints(memberID, guildID, amount)
	{

	}

	refresh() { this.config.refresh() }
}
