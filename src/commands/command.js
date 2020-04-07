const Debug = require('../debug.js')
const Random = require('../random.js')
const { RichEmbed } = require('discord.js')

const DefaultDialogueFormat 	  = '$CONTENT$\n$OPTIONS$'
const DefaultDialogueOptionFormat = ' - $EMOJI$ - *$OPTION$*'

module.exports = class Command
{
	setup(router) { }
	refresh() { }
	onMessage(msg, isCommand) { }

	getGuild(msg) { return msg.guild ? msg.guild.id : msg.channel.id }

	/*
	formatEmbed(
				msg 	: Discord Message - The command message replying to
				content : string
				options : array - An array (maximum length of 5) with objects having format
					{
						'content'  - What to display the option as
						'emoji'	   - An emoji for the user to react to, which is how they choose options
										REQUIRED UNICODE CHARACTER (just copy/paste from https://emojipedia.org/)
						'callback' - Function to be called when option is selected
							Callback(
								msg   	 : Discord Message - the original dialogue message, same as passed to formatEmbed(...)
								emoji 	 : string		   - the emoji reacted
								userData : objects		   - user data supplied to function, otherwise undefined
							)
					}
				userData : object - Data to pass to option callbacks
				dialogueFormat : string - A string for the format of the message to send
					replaces
						'$AUTHOR$'  with the user who triggered the dialogue (DiscordGuildMember if guild, otherwise DiscordUser)
						'$CONTENT$' with the dialogue message
						'$OPTIONS$' with the formatted options
				dialogueOptionFormat : string - A string for the format of the dialogue options
					replaces
						'$EMOJI$'  with the emoji for the option
						'$OPTION$' with the nae of the option
				customFilter : function(DiscordReaction, DiscordUser)
					- A callback that returns a boolean to filter out reaction events
					e.g. (reaction, user) => { return !user.presence.game } // only get reactions from users who are currently in a game
				embedColour : string - A DiscordColour for the side of the embed
			)
	*/
	sendDialogueOptions(msg,
						content,
						options = [],
						userData = undefined,
						dialogueFormat = DefaultDialogueFormat,
						dialogueOptionFormat = DefaultDialogueOptionFormat,
						customFilter = undefined,
						embedColour = undefined
					)
	{
		if(options.length > 5)
			options = options.slice(0, 5)
		let usedEmojis = [],
			optionsText = ''
		for(let i = 0; i < options.length; i++)
		{
			if(!options[i].emoji || usedEmojis.includes(options[i].emoji))
				continue
			optionsText += `\n${(dialogueOptionFormat || DefaultDialogueOptionFormat)
									.replace(/\$EMOJI\$/gi, options[i].emoji)
									.replace(/\$OPTION\$/gi, options[i].content)
								}`
		}

		let embed = new RichEmbed().setDescription((dialogueFormat || DefaultDialogueFormat)
										.replace(/\$CONTENT\$/gi, content)
										.replace(/\$OPTIONS\$/gi, optionsText)
										.replace(/\$AUTHOR\$/gi,  msg.member ? msg.member.displayName : msg.author.username)
									)
		if(embedColour)
			embed.setColor(embedColour)
		msg.channel.send(embed).then((sentMessage) =>
		{
			let collector = sentMessage.createReactionCollector(
					// filter so only calls if emoji from options, alongside any custom filter
					(reaction, user) => !user.bot && options.find(x => x.emoji == reaction.emoji.name) && (customFilter ? customFilter(reaction, user) : true)
				)
			collector.on('collect', reaction =>
			{
				try
				{
					let option = options.find(x => x.emoji == reaction.emoji.name)
					try { option.callback(msg, reaction.emoji.name, userData) }
					catch(e) { Debug.error(e, `Failed to call dialogue option callback for reaction '${reaction.emoji.name}'`, msg) }
					if(sentMessage.channel.type != 'dm' && sentMessage.channel.type != 'group' &&
								sentMessage.guild.me &&
								sentMessage.guild.me.hasPermission('MANAGE_MESSAGES')
							)
						sentMessage.clearReactions()
					collector.stop()
				}
				catch(e) { Debug.error(e, `Failed to collect emoji '${reaction.emoji.name}'`)}
			})

			for(let i = 0; i < options.length; i++)
			{
				if(!options[i].emoji)
					continue
				try { sentMessage.react(options[i].emoji) } catch(e) { Debug.error(e, `Failed to add reaction '${options[i].emoji}'`, msg) }
			}
		})
	}

	// isAdmin(DiscordMessage)
	//		See BasicCommands.isAdmin(...) (src/commands/basics.js)
	isAdmin(msg) { return require('../index.js').isAdmin(msg) }

	// isNSFW(DiscordMessage)
	//		Checks whether NSFW content is allowed on the current channel
	isNSFW(msg) { return require('../index.js').isNSFW(msg) }

	// random(Array)
	//		Returns a random element in the array
	random(arr) { return new Random().choose(arr) }

	// randomHonorific(String)
	//		Returns a random honorific, prefixed with the 'connector'
	randomHonorific(connector = '-') { return this.random([
		`${connector}san`,
		`${connector}chan`,
		' senpai',
		`${connector}tan`,
		`${connector}sama`,
		`${connector}kun`
	])}

	randomNotNSFW() { return this.random([
		'No lewdies 🙅',
		'No lewds 🙅',
		'SFW content only 👮',
		'This server or channel doesn\'t allow NSFW content 😤'
	])}

	randomNotAdmin() { return this.random([
		'Admins only 👮',
		'You need more permissionssss',
		'You need to be an administrator for that 😅'
	])}

	randomGuildsOnly() { return this.random([
		'That command can only be used in guilds',
		'Sorry, try running that in a server',
		'Unable to use that command while not in a guild'
	])}
}
