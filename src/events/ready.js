const Debug = require('../debug.js')
const { Events } = require('discord.js')
const { clientID } = require('../../config/yuki-chan.json')

module.exports =
{
	name: Events.ClientReady,
	once: true,
	execute(client)
	{
		Debug.log(`\nYuki Chan ready`, Debug.levels.HIGH, Debug.colours.BRIGHT + Debug.colours.GREEN)
		Debug.log(`\thttps://discord.com/api/oauth2/authorize?client_id=${clientID}&permissions=1101927623744&scope=bot`, Debug.levels.HIGH, Debug.colours.BRIGHT)
	}
}