try { require('dotenv').config(); console.log('Environment variables loaded') } catch(e) { console.log('dotenv not found')}

module.exports =
{
	// Priority levels
	levels: Object.freeze({
		NONE: 0,
		LOW:  1,
		MED:  2,
		HIGH: 3
	}),

	// Console colours
	colours: Object.freeze({
		NONE:	 '',
		RED :	 '\x1b[31m',
		GREEN:	 '\x1b[32m',
		YELLOW:	 '\x1b[33m',
		BLUE:	 '\x1b[34m',
		MAGENTA: '\x1b[35m',
		CYAN:	 '\x1b[36m',
		WHITE:	 '\x1b[37m',

		RESET:	 '\x1b[0m',
		BRIGHT:	 '\x1b[1m',
		DIM:	 '\x1b[2m'
	}),

	setup()
	{
		if(isNaN(process.env.DEBUG_LEVEL))
			switch(process.env.DEBUG_LEVEL)
			{
				default:
				case 'MEDIUM':
				case 'MED':  	process.env.DEBUG_LEVEL = module.exports.levels.MED;  break;
				case 'ALL': 	process.env.DEBUG_LEVEL = module.exports.levels.NONE; break;
				case 'LOW':		process.env.DEBUG_LEVEL = module.exports.levels.LOW;  break;
				case 'HIGH':	process.env.DEBUG_LEVEL = module.exports.levels.HIGH; break;
			}
		module.exports.debugLevel = module.exports.debugLevel || process.env.DEBUG_LEVEL || module.exports.levels.MED
		console.log(`Debug Level: ${module.exports.debugLevel}`)
	},

	// debug message, debug priority, colour
	log(content, debugLevel = module.exports.levels.MED, colour = module.exports.colours.NONE)
	{
		if(debugLevel >= module.exports.debugLevel)
			console.log(`${colour}${content}${module.exports.colours.RESET}`)
	},

	debug(content, debugLevel = module.exports.levels.LOW) { module.exports.log(content, debugLevel, module.exports.colours.GREEN) },
	warning(content, debugLevel = module.exports.levels.MED) { module.exports.log(content, debugLevel, module.exports.colours.YELLOW) },

	// error/exception, debug message, discord message, debug priority
	error(error, content = '', discordMsg = undefined, debugLevel = module.exports.levels.HIGH)
	{
		if(!error)
			return
		module.exports.log(`${content ? (content + ' - ') : ''}[${error.name}] ${error.message}${discordMsg ? ('\n\t' + discordMsg.cleanContent) : ''}\n\n\t${error.stack}\n`, debugLevel, module.exports.colours.RED)
	}
}
