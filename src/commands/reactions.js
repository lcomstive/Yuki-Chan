const url = require('url')
const http = require('http')
const Command = require('./command.js')
const Config = require('../config.js')
const { RichEmbed } = require('discord.js')

const DefaultReactions =
{
	hug: [
		'https://i.imgur.com/r9aU2xv.gif',
		'https://i.imgur.com/wOmoeF8.gif',
		'https://i.imgur.com/v47M1S4.gif',
		'https://i.imgur.com/4oLIrwj.gif',
		'https://i.imgur.com/XEs1SWQ.gif',
		'https://i.imgur.com/EatYxy1.gif',
		'https://i.imgur.com/VgP2ONn.gif',
		'https://i.imgur.com/34Ldmbz.gif',
		'https://i.imgur.com/hA9ZNoR.gif',
		'https://i.imgur.com/iKPs2AJ.gif',
		'https://i.imgur.com/14FwOef.gif',
		'https://i.imgur.com/hgDeZLg.gif',
		'https://i.imgur.com/daowaXJ.gif'
	],
	slap: [
		'https://i.imgur.com/fm49srQ.gif',
		'https://i.imgur.com/4MQkDKm.gif',
		'https://i.imgur.com/oOCq3Bt.gif',
		'https://i.imgur.com/Agwwaj6.gif',
		'https://i.imgur.com/YA7g7h7.gif',
		'https://i.imgur.com/oRsaSyU.gif',
		'https://i.imgur.com/kSLODXO.gif',
		'https://i.imgur.com/CwbYjBX.gif'
	],
	pat: [
		'https://i.imgur.com/2lacG7l.gif',
		'https://i.imgur.com/UWbKpx8.gif',
		'https://i.imgur.com/4ssddEQ.gif',
		'https://i.imgur.com/2k0MFIr.gif',
		'https://i.imgur.com/NNOz81F.gif',
		'https://i.imgur.com/6mSpKwd.gif',
		'https://i.imgur.com/sLwoifL.gif',
		'https://i.imgur.com/hEo9s8l.gif'
	],
	dance: [
		'https://i.imgur.com/w5AeGIz.gif',
		'https://i.imgur.com/yVcciQK.gif',
		'https://gfycat.com/fittingdizzyhornedviper',
		'https://media1.tenor.com/images/aa9374ef547c871d4626a22d24042d1f/tenor.gif?itemid=10495378',
		'https://media1.tenor.com/images/21e860a31f32d5e3e6bdf2963cadfebf/tenor.gif?itemid=5897404',
		'https://media1.tenor.com/images/94e0a12faac0821738185def2d96a808/tenor.gif?itemid=7797151',
		'https://media1.tenor.com/images/59cf8269123c2fb32eb00114d384cdd5/tenor.gif?itemid=12503868',
		'https://media1.tenor.com/images/b013100cef1cde9158b0371fc1cf7489/tenor.gif?itemid=8074573',
		'https://media1.tenor.com/images/ea99c7df73cf7e6c4e09a3b8993c7f1c/tenor.gif?itemid=4979462'
	]
}

const DefaultFormats = {
	dance: '$SENDER dances with $USER',
	pat: '$SENDER pats $USER'
}

formatText = (text, reaction, sender, username) =>
{
	if(text == '<empty>') return undefined
	return ((text == '<default>' ? undefined : text) || `\\*$REACT${reaction.match(/(sh|ch)$/i) ? 'es' : 's'} $USER\\*`)
		.replace(/\$reacts/gi, reaction + (reaction.match(/sh|ch$/i) ? 'es' : 's'))
		.replace(/\$react/gi, reaction)
		.replace(/\$sender/gi, sender)
		.replace(/\$user/gi, username)
}

module.exports = class Reactions extends Command
{
	setup(router)
	{
		this.config = Config('reactions')

		this.config.slap  = this.config.slap  || DefaultReactions.slap
		this.config.hug   = this.config.hug   || DefaultReactions.hug
		this.config.pat   = this.config.pat   || DefaultReactions.pat
		this.config.dance = this.config.dance || DefaultReactions.dance
		this.config.save()

		// react list
		// reaction list
		//		Lists all available reactions
		router.add(/^(reaction|react) list/i, (params, msg) =>
		{
			let listMsg = `Reactions:`
			listMsg += '\n - hug'
			listMsg += '\n - slap'
			listMsg += '\n - pat'
			listMsg += '\n - dance'

			let guildID = this.getGuild(msg)
			this.config.guilds = this.config.guilds || {}
			if(this.config.guilds[guildID])
				for(const [key, val] of Object.entries(this.config.guilds[guildID]))
				{
					if(key == 'formats' || key == 'colours' || key == 'hug' || key == 'slap')
						continue
					listMsg += `\n - ${key}`
				}

			msg.channel.send(listMsg)
		})
		// reaction list <reaction>
		// react list <reaction>
		//		Lists all images in the current guild for the given reaction
		// e.g. reaction list hug
		.add(/^(reaction|react) list (\w+)/i, (params, msg) =>
		{
			params.splice(0, 1)
			let guildID = this.getGuild(msg)
			this.config.guilds = this.config.guilds || {}
			if(!this.config.guilds[guildID] || !this.config.guilds[guildID][params[0].toLowerCase()])
			{
				msg.channel.send(`This server doesn't have any reactions for '${params[0]}'`)
				return
			}
			let listMsg = `Reactions for *${params[0].toLowerCase()}*:`
			for(let i = 0; i < this.config.guilds[guildID][params[0].toLowerCase()].length; i++)
				listMsg += `\n [\`${i}\`] ${this.config.guilds[guildID][params[0].toLowerCase()][i]}`
			msg.channel.send(listMsg)
		})
		// reaction list
		// 		Lists all available reactions for current guild
		.add(/^(reaction|react) list$/i, (params, msg) =>
		{
			params.splice(0, 1)
			let guildID = this.getGuild(msg)
			this.config.guilds = this.config.guilds || {}
			if(!this.config.guilds[guildID])
			{
				msg.channel.send(`This server doesn't have any reactions`)
				return
			}
			let listMsg = `Reactions:`
			for(const [key, val] of Object.entries(this.config.guilds[guildID]))
			{
				if(key == 'formats' || key == 'colours')
					continue
				listMsg += `\n - [\`${val.length}\`] \t${key}`
			}
			msg.channel.send(new RichEmbed().setDescription(listMsg))
		})
		// reaction format <reaction> <format>
		// reaction format help
		//		Sets the format for a given reaction in the current guild
		//		Available parameters: (see formatText(...))
		//			$REACT - The reaction used (e.g. 'hug', 'slap')
		//			$USER  - The receiver of the reaction (the sender if none given)
		// e.g. reaction format slap $REACTs $USER hard
		.add(/^(reaction|react) format (\w+)(.*)?/i, (params, msg) =>
		{
			let guildID = this.getGuild(msg)
			if(!this.config.guilds)
				this.config.guilds = {}
			if(!this.config.guilds[guildID])
				this.config.guilds[guildID] = {}
			if(!this.config.guilds[guildID].formats)
				this.config.guilds[guildID].formats = DefaultFormats
			if(params[1].toLowerCase() == 'help')
			{
				let help = new RichEmbed()
				.setDescription('Reaction Format Parameters:')
				.addField('`$REACT`', 'The reaction used (*.e.g. \'hug\', \'slap\'*)', true)
				.addField('`$SENDER`', 'The sender of the reaction (*Yuki if no receiver was given)')
				.addField('`$USER`', 'The receiver of the reaction (*the sender if none given*)', true)
				.addBlankField()
				.addField('Example', 'To get slaps to read `"give @user a slap"` you can do `reaction format slap give $USER a $REACT`')
				msg.channel.send('`reaction format <reaction> <format>`', help)
				return
			}
			if(!params[2])
			{
				this.config.guilds[guildID].formats[params[1].toLowerCase()] = '<empty>'
				msg.channel.send(`Cleared format for '${params[1].toLowerCase()}'`)
				return
			}
			let format = msg.cleanContent.substring(`${params[0]} format ${params[1]} `.length).trim()
			if(format.match(/\".+\"/))
				format = format.substring(1, format.length - 1)
			if(format.match(/default|reset/i))
			{
				this.config.guilds[guildID].formats[params[1].toLowerCase()] = '<default>'
				msg.channel.send(`Reset format for '${params[1].toLowerCase()}'`)
				return
			}
			this.config.guilds[guildID].formats[params[1].toLowerCase()] = format
			this.config.save()
			msg.channel.send(`Set format of '*${params[1]}*' to \`${format}\``)
		}, { adminRequired: true })
		// reaction color|colour <reaction> <colour>
		//		Sets the embed colour for the given reaction in the current guild
		//		Reaction can be any tag (reaction) or 'default'
		//		Colours can be anything from https://discord.js.org/#/docs/main/stable/typedef/ColorResolvable
		// e.g. reaction colour default random
		// e.g. reaction colour hug red
		// e.g. reaction color slap [244,66,66]
		// e.g. reaction colour slap #f44242
		.add(/^(reaction|react) (color|colour) (\w+) (\S+)/i, (params, msg) =>
		{
			params.splice(0, 1)
			let guildID = this.getGuild(msg)
			if(!this.config.guilds)
				this.config.guilds = {}
			if(!this.config.guilds[guildID])
				this.config.guilds[guildID] = {}
			if(!this.config.guilds[guildID].colours)
				this.config.guilds[guildID].colours = {}
			this.config.guilds[guildID].colours[params[1].toLowerCase()] = params[2].toUpperCase()
			msg.channel.send(`Set colour of '${params[1].toLowerCase()}' to '${params[2].toUpperCase()}'`)
		}, { adminRequired: true })
		// reaction <add|remove> <reaction> <url>
		//		Adds or removes an image (url) with the given tag (reaction) for the current guild
		//		Removal can either be a URL or index
		// e.g. react add hug https://i.imgur.com/QJbBsDJ.gif
		// e.g. reaction remove hug 2
		.add(/^(reaction|react) (add|remove) (\w+) (.*)/i, (params, msg) =>
		{
			params.splice(0, 1)
			let guildID = this.getGuild(msg)
			if(!params[1])
			{
				msg.channel.send(`A proper reaction is required, '${params[1]}' is not valid`)
				return
			}
			let subIndex = 'reaction'.length + params[0].length + params[1].length + 4
			let link = msg.content.length > subIndex ? msg.content.substring(subIndex) : undefined
			if(link && link.includes('googleusercontent.com/proxy/'))
				link += '-tmp.gif' // Google API to get a gif from proxy link
			if(link && link.endsWith('gifv'))
				link = link.substring(0, link.length - 1)
			if(!this.config.guilds)
				this.config.guilds = {}
			this.config.guilds[guildID] = this.config.guilds[guildID] || {}
			if(params[0].toLowerCase() == 'add')
			{
				if(!link || !link.match(/\.(gif|png|jpg|jpeg)/i))
				{
					msg.channel.send(`'${link || 'That'} is an invalid URL, needs to be a \`gif\`, \`png\`, \`jpg\` or \`jpeg\``)
					return
				}

				let request = http.request({ method: 'HEAD', host: url.parse(link).host, path: url.parse(link).pathname, port: 80 }, (response) =>
				{
					if(!response.statusCode == 200)
					{
						msg.channel.send(`Cannot access the url '${link}'`)
						return
					}
					// Set default as array if necessary
					this.config.guilds[guildID][params[1].toLowerCase()] = this.config.guilds[guildID][params[1].toLowerCase()] || []
					this.config.guilds[guildID][params[1].toLowerCase()].push(link)
					this.config.save()
					msg.channel.send(new RichEmbed()
								.setDescription(`Added to '${params[1].toLowerCase()}'`)
								.setImage(link)
							)
				})
				request.on('error', (err) => msg.channel.send(`Failed to add - ${err.message.includes('ENOTFOUND') ? 'Cannot find image' : err.message}`))
				request.end()
			}
			else if(params[0].toLowerCase() == 'remove')
			{
				let urls = this.config.guilds[guildID][params[1].toLowerCase()]
				let urlCount = urls.length
				if(isNaN(link))
				{
					let url = link.toLowerCase()
					for(let i = urls.length - 1; i >= 0; i--)
					{
						if(urls[i].toLowerCase() == url)
						{
							urls = urls.splice(i, 1)
							msg.channel.send(`Removed from '${params[1].toLowerCase()}'`)
							break
						}
					}
					if(urls.length == urlCount)
						msg.channel.send(`Couldn't find the URL '${link}' to remove`)
				}
				else
				{
					let index = parseInt(params[2])
					if(index >= 0 && index < urls.length)
					{
						urls.splice(index, 1)
						msg.channel.send(`Removed link from '${params[1].toLowerCase()}'`)
					}
					else
						msg.channel.send(`Invalid index (${index}/${urls.length - 1})`)
				}
				if(urls.length != urlCount)
				{
					this.config.guilds[guildID][params[1].toLowerCase()] = urls
					this.config.save()
				}
			}
		}, { adminRequired: true })
		// slap|hug (@user)
		//		Sends a random image from an array for the given reaction
		//		(current guild images are added if available)
		// e.g. slap @Yuki-Chan
		// e.g. hug
		.add(/^(slap|hug|pat|dance)(.*)?/i, (params, message) =>
		{
			let mentions = params[1] && message.mentions.users.size > 0
			let authorName = message.member ? message.member.displayName : message.author.username
			let name = authorName
			let guildID = this.getGuild(message)
			if(!this.config.guilds)
				this.config.guilds = {}
			if(!this.config.guilds[guildID])
				this.config.data.guilds[guildID] = {}
			if(!this.config.guilds[guildID].formats)
				this.config.guilds[guildID].formats = DefaultFormats
			if(mentions)
				name = message.mentions.members ? message.mentions.members.first().displayName : message.mentions.users.first().username
			else if(params[1])
				name = params[1].substring(1)
			let reactions = this.config[params[0].toLowerCase()]
			if(this.config.guilds[guildID][params[0].toLowerCase()])
				reactions.push.apply(reactions, this.config.guilds[guildID][params[0].toLowerCase()])
			let reaction = this.random(reactions)
			let colour = this.config.guilds[guildID].colours ?
							(this.config.guilds[guildID].colours[params[0].toLowerCase()] ?
								this.config.guilds[guildID].colours[params[0].toLowerCase()] :
								this.config.guilds[guildID].colours['default'] || 'RANDOM') :
							'RANDOM'
			let reactionText = formatText(
									this.config.guilds[guildID].formats ?
										this.config.guilds[guildID].formats[params[0].toLowerCase()] :
										undefined,
									params[0].toLowerCase(),
									params[1] ? authorName : 'Yuki-Chan',
									name + this.randomHonorific(mentions ? ' ' : '-')
								)
			message.channel.send(reactionText, reaction ?
									new RichEmbed()
										.setAuthor(name == authorName ? authorName : `${authorName} -> ${name}`)
										.setColor(colour)
										.setImage(reaction)
									: undefined
						)
					.catch((err) => message.channel.send(`Failed to send reaction ('${reaction}') - ${err}`))
		})
		// react <reaction> (@user)
		//		Sends a random image from an array for the given reaction using the current guilds reactions
		// e.g. react hug @Yuki-Chan
		.add(/^(react|reaction) (?!help)(\w+)(.*)?/i, (params, msg) =>
		{
			params.splice(0, 1)
			let guildID = this.getGuild(msg)
			if(!this.config.guilds)
				this.config.guilds = {}
			if(!this.config.guilds[guildID])
				this.config.guilds[guildID] = {}
			if(!this.config.guilds[guildID].formats)
				this.config.guilds[guildID].formats = DefaultFormats
			if(!params[0])
			{
				msg.channel.send('Invalid reaction')
				return
			}
			let reaction = params[0].toLowerCase()
			if(!this.config.guilds[guildID][reaction])
			{
				msg.channel.send(`This server doesn't have any reactions for ${reaction}`)
				return
			}
			let reactions = this.config.guilds[guildID][reaction]
			let mentions = params[1] && msg.mentions.users.size > 0
			let authorName = msg.member ? msg.member.displayName : msg.author.username
			let name = authorName
			if(mentions)
				name = msg.mentions.members ? msg.mentions.members.first().displayName : msg.mentions.users.first().username
			else if(params[1])
				name = params[1].substring(1)
			let reactionText = formatText(
									this.config.guilds[guildID].formats ?
										this.config.guilds[guildID].formats[params[0].toLowerCase()] :
										undefined,
									params[0].toLowerCase(),
									params[1] ? `${authorName}${this.randomHonorific()}` : 'Yuki-Chan',
									name + this.randomHonorific(mentions ? ' ' : '-')
								)
			let colour = this.config.guilds[guildID].colours ?
							(this.config.guilds[guildID].colours[params[0].toLowerCase()] ?
								this.config.guilds[guildID].colours[params[0].toLowerCase()] :
								this.config.guilds[guildID].colours['default'] || 'RANDOM') :
							'RANDOM'
			reaction = this.random(reactions)
			msg.channel.send(reactionText, reaction ?
									new RichEmbed()
										.setAuthor(name == authorName ? authorName : `${authorName} -> ${name}`)
										.setColor(colour)
										.setImage(reaction)
									: undefined
						)
					.catch((err) => msg.channel.send(`Failed to send reaction ('${reaction}') - ${err}`))
		})
		// help react
		// reaction help
		//		Sends command usage and description for reactions
		.add(/^(help react)|((react|reaction) help)/i, (params, msg) =>
		{
			msg.channel.send('Reaction Commands', new RichEmbed()
			.addField('`<slap|hug|pat|dance> (@user)`', 'Sends a random image from a list of available reactions (current guild images included)\n' +
													  '(*.e.g* `slap @Yuki-Chan`, `hug`)')
			.addBlankField()
			.addField('`react <reaction> (@user)`', 'Sends a random image from a list of available reactions in the current guild\n' +
															'(*.e.g* `react highfive @Yuki-Chan`, `react hug`)')
			.addBlankField()
			.addField('`reaction list (reaction)`', 'Lists all images in the current guild for the given reaction, or all available reactions if none given\n(*e.g.* `reaction list hug`)')
			.addBlankField()
			.addField('`reaction format <reaction> <contents>`', 'Sets the format for the given reaction in the current guild\n' +
																		 '(*.e.g.* `reaction format slap $REACTs $USER hard`)\n' +
																		 '(`reaction format help` for available parameters)')
			.addBlankField()
			.addField('`reaction <color|colour> <reaction> <colour>`', 'Sets the embed colour shown next to the given reaction in the current guild\n' +
																			   '(*.e.g* `reaction colour slap #f44242`, `reaction colour default red`, `reaction colour hug random`)\n' +
																			   '(*See [discord.js.org](https://discord.js.org/#/docs/main/stable/typedef/ColorResolvable) for all colours*)')
			.addBlankField()
			.addField('`reaction <add|remove> <reaction> <url>`', 'Adds or removes an image (url) with the given tag (reaction) for the current guild\n' +
																		  'Removal can either be a URL or index\n' +
																	  	  '(*e.g.* `reaction remove hug https://i.imgur.com/QJbBsDJ.gif`, `reaction remove slap 2`)')
			)
		})
		.add(/^(react|reaction)/i, (params, msg) => { msg.channel.send('Unknown command, see `react help` for available commands') })
	}

	refresh() { this.config.refresh() }
}
