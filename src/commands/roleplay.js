const fs = require('fs')
const Debug = require('../debug.js')
const Config = require('../config.js')
const Command = require('./command.js')
const { RichEmbed } = require('discord.js')

module.exports = class Roleplay extends Command
{
	setup(router)
	{
		this.config = Config('roleplay')

		this.config.routesDir = this.config.routesDir || './config/dialogue_routes/'
		if(!this.config.routesDir.endsWith('/'))
			this.config.routesDir += '/'
		if(!fs.existsSync(this.config.routesDir))
			fs.mkdirSync(this.config.routesDir)

		// 'user' object
		// {
		// 		id: discord_id,
		// 		currentDialogue: { // dialogue user was last on, undefined for none
		//			file: 'file/path.json',
		//			routeIndex: 0, // index of object with 'file' in 'this.routes'
		//			nodeID: 0 // Last node without user response or <=0 for first
		//		}
		// }
		this.config.users = this.config.users || []

		// 'route' object
		// {
		//		path: 'file/path.json',
		//		nodes: {
		//			id: 0,
		//			content: 'message content',
		//			options: {
		//				emoji: 0, // index of emoji
		//				emojiRaw: '❤', // emoji string
		//				next: -1, // index of next node
		//			}
		//		}
		// }

		// list of emojis for options
		this.config.emojis = this.config.emojis || [
			'❓',
			'❤',
			'😀',
			'😁',
			'😂',
			'🤣',
			'😃',
		]

		this.routes = []
		this.refresh()
		this.config.save()

		Debug.log(`Roleplay Stats:\n\tDialogue Directory: '${this.config.routesDir}'\n\tEmojis: ${this.config.emojis.length}\n\tRoutes: ${this.routes.length}`)

		/*
		// roleplay|rp list
		//		Retrieves a list of available scenarios
		router.add(/^(roleplay|rp) list$/i, (params, msg) =>
		{
			let scenarios = '**Scenarios**:\n'
			for(let i = 0; i < this.routes.length; i++)
				scenarios += ` - *${this.routes[i].path.replace('_', ' ')}*\n`
			msg.channel.send(scenarios)
		})
		*/
		// roleplay|rp
		//		Initiates roleplay with Yuki-Chan
		router.add(/^(roleplay|rp)$/i, (params, msg) =>
		{
			if(!this.routes || this.routes.length == 0)
			{
				msg.channel.send('There aren\'t any routes to take')
				return
			}
			// msg.channel.send('That isn\'t supported just yet, check back later')
			let user = this.config.users.find(x => x.id == msg.author.id)
			if(!user)
			{
				user = {
					id: msg.author.id,
					currentDialogue: undefined
				}
				this.config.users.push(user)
				this.config.save()
			}
			this.sendDialogue(msg, user)
		})
		.add(/^testdialogue$/i, (params, msg) =>
		{
			this.sendDialogueOptions(msg, 'Example dialogue with options', [
				{
					content: 'Test Heart',
					emoji: '❤',
					callback: (message, emoji) => message.channel.send('Naww, love you toooo')
				},
				{
					content: 'Second option',
					emoji: '🎈',
					callback: (message, emoji) => message.channel.send(`Second option received ${emoji}`)
				},
				{
					content: 'Other',
					emoji: '📷',
					callback: (message, emoji) => message.channel.send('🎵 You don\'t ooowwwnnnn meeee 🎵')
				}
			],
			undefined, // user data
			' -> $AUTHOR$\n$CONTENT$\n\n$OPTIONS$',
			' $EMOJI$ for *$OPTION$*',
			(reaction, user) => user.id == msg.author.id,
			'RANDOM'
			)
		})
		// rp help
		// help roleplay
		.add(/^(help (roleplay|rp))|((roleplay|rp) help)$/i, (params, msg) =>
		{
			msg.channel.send('Roleplay Help', new RichEmbed()
				.addField('`roleplay`, `rp`', 'Initiates roleplay with Yuki-Chan')
			)
		})
	}

	refresh()
	{
		// Load routes
		let routes = []
		fs.readdirSync(this.config.routesDir).forEach((file) =>
		{
			if(!file.endsWith('.json'))
				return
			let path = `${this.config.routesDir}${file}`
			let route = JSON.parse(fs.readFileSync(path, 'utf8'))
			route.path = path
			routes.push(route)
		})
		this.routes = routes

		for(let i = 0; i < this.routes.length; i++)
		{
			if(!this.routes[i].nodes)
				continue
			for(let n = 0; n < this.routes[i].nodes.length; n++)
			{
				for(let j = 0; j < this.routes[i].nodes[n].options.length; j++)
				{
					this.routes[i].nodes[n].options[j].emojiRaw = this.config.emojis[this.routes[i].nodes[n].options[j].emoji]
				}
			}
		}

		for(let i = 0; i < this.config.users.length; i++)
		{
			if(!this.config.users[i].currentDialogue)
				continue
			let routeIndex = this.routes.findIndex(x => x.path == this.config.users[i].currentDialogue.file)
			if(routeIndex == -1)
				this.config.users[i].currentDialogue = undefined
			else
				this.config.users[i].currentDialogue.routeIndex = routeIndex
		}
	}

	// 'data' object
	// {
	//		user - user data,
	//		caller - pointer to calling object
	//		userIndex - index of user data in caller config
	// }
	_chooseOption(discordMsg, emoji, data)
	{
		let user = data.user
		let route = data.caller.routes[user.currentDialogue.routeIndex]
		if(!route)
		{
			Debug.warning(`Failed to receive dialogue for route ${user.currentDialogue.routeIndex}`)
			data.caller.config.users[data.userIndex].currentDialogue.currentDialogue = undefined
			discordMsg.channel.send('Something went wrong, sorry. Try a different route')
			return
		}
		console.log(`Comparing emoji for '${emoji}'`)
		user.currentDialogue.nodeID = route.nodes[user.currentDialogue.nodeID].options.find(x => x.emojiRaw == emoji).next

		console.log(`Next node: ${user.currentDialogue.nodeID}`)
		if(user.currentDialogue.nodeID < 0 /* || route.nodes[user.currentDialogue.nodeID].options.length == 0 */) // end of dialogue
			user.currentDialogue = undefined

		data.caller.config.users[data.userIndex].currentDialogue = user.currentDialogue
		data.caller.config.save()

		if(user.currentDialogue != undefined)
			data.caller.sendDialogue(discordMsg, data.caller.config.users[data.userIndex])
	}

	_newDialogue(index = -1)
	{
		let routeIndex = index == -1 ? Math.floor(Math.random() * this.routes.length) : index
		let randomDialogue = this.routes[routeIndex]
		return {
			file: randomDialogue.path,
			routeIndex: routeIndex,
			nodeID: 0
		}
	}

	sendDialogue(discordMsg, user)
	{
		if(user.currentDialogue == undefined)
			user.currentDialogue = this._newDialogue()

		let route = this.routes[user.currentDialogue.routeIndex]
		if(!route)
		{
			Debug.warning(`Failed to send dialogue for route #${user.currentDialogue.routeIndex}`)
			this.config.users.find(x => x.id == user.id).currentDialogue = undefined
			discordMsg.channel.send('Something went wrong, sorry. Try a different route')
			return
		}
		if(!user.currentDialogue.nodeID || user.currentDialogue.nodeID < 0)
			user.currentDialogue.nodeID = 0
		let currentNode = route.nodes[user.currentDialogue.nodeID]
		Debug.log(`Current Node: (#${user.currentDialogue.nodeID})\n\t${JSON.stringify(currentNode)}`)

		let options = []
		for(let i = 0; i < currentNode.options.length; i++)
		{
			let option = currentNode.options[i]
			Debug.log(`Option: ${JSON.stringify(option)}`)
			options.push({
				content: option.content || '',
				emoji: option.emojiRaw,
				callback: this._chooseOption
			})
		}
		if(currentNode.options.length == 0)
			this.config.users.find(x => x.id == user.id).currentDialogue = undefined
		console.log(`Options: ${JSON.stringify(options)}`)

		this.sendDialogueOptions(discordMsg,
									currentNode.content,
									options,
									{ // custom data
										user: user,
										caller: this,
										userIndex: this.config.users.findIndex(x => x.id == user.id)
									},
									' -> $AUTHOR$\n$CONTENT$\n\n$OPTIONS$', // message format
									' ($EMOJI$) $OPTION$', // options format
									(reaction, user) => user.id == discordMsg.author.id, // make sure only accepts emoji from desired user,
									'RANDOM' // random colour on side of embed
								)
	}
}
