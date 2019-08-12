const Debug = require('./debug.js')

module.exports = class Router
{
	constructor() { this.reset() }

	reset() { this.routes = [] }

	/*
	add(
		path : string|Regex - What to check the message against (e.g. /kick (.*)/i )
		callback : function(
						parameters : array - The groups matched in the regex
							e.g. Path: /avatar (.*)/
								 Command "avatar John" would be processed as /avatar John/
								 and parameters would be an array of [ "John" ],
						msg : DiscordMessage - The message that triggered the match
					)
					if a callback returns false the command continues to get processed,
					triggering the next match, if any
		adminRequired : boolean - Whether admin privileges are required
		nsfw 		  : boolean - Whether NSFW content is used
		dirtyMessage  : boolean - Should the regex be checked against a dirty or clean discord message?
								  Clean messages have the raw text "@Yuki-Chan",
								  	whereas dirty is processed "<@222079895583457280>"
	*/
	add(path, fn, options = {})
	{
		options.nsfw = options.nsfw || false
		options.guildsOnly = options.guildsOnly || false
		options.dirtyMessage = options.dirtyMessage || false
		options.adminRequired = options.adminRequired || false

		if(typeof path == 'function')
		{
			fn = path
			path = ''
		}
		this.routes.push(
			{
				path: path,
				callback: fn,
				options: options
			})
		return this
	}

	remove(path)
	{
		for(let i = 0, r; i < this.routes.length, r = this.routes[i]; i++)
		{
			if(r.path == path)
			{
				this.routes.splice(i, 1)
				return this
			}
		}
		return this
	}

	check(message, substringLength, isAdmin)
	{
		let dirtyMessage = message.content.substring(substringLength),
			cleanMessage = message.cleanContent.substring(substringLength)
		let content
		for(let i = 0; i < this.routes.length; i++)
		{
			content = this.routes[i].options.dirtyMessage ? dirtyMessage : cleanMessage
			let match = content.match(this.routes[i].path)
			Debug.log(`Checking '${this.routes[i].path}' against '${content}' ${match == undefined ? '' : '[MATCH]'}`, Debug.levels.NONE)
			if(match)
			{
				match.shift()
				let index = require('./index.js')
				if(this.routes[i].options.adminRequired == true && !isAdmin)
				{
					message.channel.send(index.randomNotAdmin())
					return this
				}
				if(this.routes[i].options.nsfw == true && !index.isNSFW(message))
				{
					message.channel.send(index.randomNotNSFW())
					return this
				}
				if(this.routes[i].options.guildsOnly == true && (message.channel.type == 'dm' || message.channel.type == 'group'))
				{
					message.channel.send(index.randomGuildsOnly())
					return this
				}
				try
				{
					let processed = this.routes[i].callback(match, message)
					if(processed == undefined || processed)
						return this // if callback returns false then continue to process command
				}
				catch(e)
				{
					message.channel.send(`Failed to call - [${e.name}] ${e.message}`)
					Debug.error(e, `Failed to call ${content}`)
				}
			}
		}
		return this
	}
}
