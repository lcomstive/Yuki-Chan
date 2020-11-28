class NodeOption
{
	constructor(parentID, emojiIndex = 0, next = -1, content = '')
	{
		this.content = content
		this.next = next // Next Node ID
		this.emojiIndex = emojiIndex // Index of emoji to display
		this.parentID = parentID // Node ID for parent
	}
}

class Node
{
	constructor(id)
	{
		this.id = id
		this.inputs = []
		this.position = { x: 0, y: 0 }

		this.content = ''
		this.options = []
		
		this.variableChange =
		{
			name: '',
			value: 0
		}
	}
}

class Dialogue
{
	constructor()
	{
		this.nodes = []
		this.variables = new Map()
	}
}
