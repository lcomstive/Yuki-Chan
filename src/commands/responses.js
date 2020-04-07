const Command = require('./command.js')
const Config = require('../config.js')

const DefaultResponses =
{
	// 'REGEX': [ RESPONSE1, RESPONSE2, etc... ]

	'no homo': [ '\\*evades the gayness\\*', 'full homo' ],
	'(give|need|want)(.*)?hug':
	[
		'\\*hugs $SENDER$\\*',
		'I\'ll hug yoouu',
		'I-I can h-hug you',
		'Come give *me* a huggg',
		'Yuki\'s here to hug you'
	],
	'what if I': [ 'But that\'s heresy!' ],
	'(suck|eat|touch) my \\w+':
	[
		'Maybe I will',
		'Alright',
		'H-HENTAI!',
		'Don\'t be so lewd >o<',
		'W-What?!',
		'I don\'t want to...',
		'o.O'
	],
	'(really|actually|will you)\\?':
	[
		'Yes',
		'No',
		'You\'ll have to find out later UwU',
		'Ask me again later',
		'Maybe',
		'Who knows'
	]
}

module.exports = class Responses extends Command
{
	setup(router)
	{
		this.config = Config('responses')
		this.refresh()
		this.config.save()
	}

	onMessage(msg, isCommand)
	{
		for(let key in this.config.responses)
		{
			if(!msg.content.match(new RegExp(key, 'i'))) // Match regex
				continue
			msg.channel.send(
				this.random(this.config.responses[key])
				.replace(/\$SENDER\$/gi,
					msg.member ?
						msg.member.displayName :
						msg.author.username
					)
			)
			break
		}
	}

	refresh()
	{
		this.config.refresh()
		this.config.responses = this.config.responses || DefaultResponses
	}
}
