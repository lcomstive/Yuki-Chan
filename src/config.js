const fs = require('fs')
const Debug = require('./debug.js')
const ConfigDirectory = './config/'

class Config
{
	constructor(path)
	{
		this._path = `${ConfigDirectory}${path}.json`
		this.data = {}
		this.refresh()
	}

	// Re-reads file into internal data
	refresh() { this.data = this.read() }

	// Returns file without overriding internal data
	read()
	{
		// Check if directory exists
		if(!fs.existsSync(ConfigDirectory))
			fs.mkdirSync(ConfigDirectory)
		// Check if file exists
		if(!fs.existsSync(this._path))
			fs.writeFileSync(this._path, '{}') // write a default .json file

		// Read config
		Debug.log(`Reading config '${this._path}'`, Debug.levels.NONE)
		return JSON.parse(fs.readFileSync(this._path))
	}

	save()
	{
		// Write config
		Debug.log(`Writing config '${this._path}'`, Debug.levels.NONE)
		fs.writeFileSync(this._path, JSON.stringify(this.data, undefined, '\t')) // use tab for whitespace
	}
}

// Proxy so commands can call e.g. 'this.config.id' instead of 'this.config.data.id' (just code reduction and easier reading)
module.exports = (path) => new Proxy(new Config(path), {
	get: (target, name) =>
	{
		if(name in target)
			return target[name]
		if(name in target.data)
			return target.data[name]
		return undefined
	},
	set: (target, name, value) =>
	{
		if(name in target)
			target[name] = value
		else if(name in target.data)
			target.data[name] = value
		else
			target.data[`${name}`] = value
		return true
	}
})
