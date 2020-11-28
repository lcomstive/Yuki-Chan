const svgNS = 'http://www.w3.org/2000/svg'

let pointer =
{
	target: undefined,
	origin: { x: 0, y: 0 }
}

getPointFromEvent = (event) => ({
		x: event.targetTouches ? event.targetTouches[0].clientX : event.clientX,
		y: event.targetTouches ? event.targetTouches[0].clientY : event.clientY
	})

const EmojiDictionaryPath = './emoji.json'
const defaultTheme =
{
	background: '#3a424f',
	foreground: 'white',
	fontSize: '16px',

	nodeWidth: '250px',
	nodeHeight: '200px',
	nodeBorderWidth: '0px',
	nodeBorderRadius: '0px',
	nodeBackground: '#1e73ff',
	nodeBorderColour: '#505e75',

	nodeConnectorSize: '20px',
	nodeConnectorFill: 'rgba(255, 255, 255, 0.5)',
	nodeConnectorRadius: '50px',

	nodePathSize: '3px',
	nodePathColour: '#5b76a3',

	context: {
		width: '250px',
		height: '225px',
		foreground: '#fff',
		borderRadius: '3px',
		borderWidth: '0px',
		background: 'rgba(86, 105, 137, 0.75)',
		borderColour: '#607599',

		emojiList: {
			borderRadius: '3px',
			borderWidth: '1px',
			background: 'rgba(0, 0, 0, 0.1)',
			backgroundActive: 'rgba(0, 0, 0, 0.4)',
			items: {
				borderWidth: '1px',
				background: 'rgba(255, 255, 255, 0.1)',
				borderColour: 'rgba(0, 0, 0, 0.4)',
				backgroundHover: 'rgba(0, 0, 0, 0.2)'
			}
		}
	},

	scrollbar: {
		width: '5px',
		background: 'rgba(0, 0, 0, 0.2)',
		thumbColour: 'rgba(0, 0, 0, 0.3)',
		thumbColourHover: 'rgba(0, 0, 0, 0.5)'
	}
}
let currentTheme = undefined
let importExportModal = undefined
let contextMenu = undefined, contextTarget = undefined
let currentPath = undefined, pathStartNode = undefined

setProperty = (name, value) => document.body.style.setProperty(name, value)

// Returns a string for an SVG path
//		'a' (start) and 'b' (end) should be objects with 'x' and 'y' properties
//		e.g. { x: 0, y: 0 }
getSVGPath = (a, b) =>
{
	let diff = {
		x: b.x - a.x,
		y: b.y - a.y
	}

	let pathStr = `M${a.x},${a.y} C`
	pathStr += `${a.x + diff.x / 3 * 2},${a.y} `
	pathStr += `${a.x + diff.x / 3},${b.y} `
	pathStr += `${b.x},${b.y}`

	return pathStr
}

// Adds event listeners for touch, mouse and pointer
addMouseListener = (obj, callbackDown, callbackMove = undefined, callbackUp = undefined) =>
{
	if(window.PointerEvent)
	{
		if(callbackUp)	 obj.addEventListener('pointerup', callbackUp)
		if(callbackDown) obj.addEventListener('pointerdown', callbackDown)
		if(callbackMove) obj.addEventListener('pointermove', callbackMove)
	}
	else
	{
		if(callbackUp) 	 obj.addEventListener('mouseup', callbackUp)
		if(callbackDown) obj.addEventListener('mousedown', callbackDown)
		if(callbackMove) obj.addEventListener('mousemove', callbackMove)

		if(callbackUp) 	 obj.addEventListener('touchend', callbackUp)
		if(callbackDown) obj.addEventListener('touchstart', callbackDown)
		if(callbackMove) obj.addEventListener('touchmove', callbackMove)
	}
}

class DialogueUI extends Dialogue
{
	constructor(element)
	{
		super()

		for(let i = 0; i < 4; i++)
		{
			let node = new NodeUI(this, this.nodes.length, this.nodes[this.nodes.length - 1])
			node.content = ['Some example content', 'Something about bees..?', 'Dialoguuueee', 'Pls revive,\nI hav raygun'][i]
			for(let j = 0; j < Math.floor(Math.random() * 5); j++)
				node.options.push(new NodeOption(node.id, (i + 1) * (j + 1)))
			this.nodes.push(node)
		}

		if(!currentTheme)
			DialogueUI.changeTheme(defaultTheme)

		this.element = document.createElement('div')
		this.element.dialogue = this

		this.svgElement = document.createElementNS(svgNS, 'svg')
		this.svgElement.classList.add('dialogue')
		this.svgElement.dialogue = this
		document.body.appendChild(this.svgElement)

		let foreignObject = document.createElementNS(svgNS, 'foreignObject')
		foreignObject.dialogue = this
		foreignObject.setAttribute('x', 0)
		foreignObject.setAttribute('y', 0)
		foreignObject.setAttribute('width', '100%')
		foreignObject.setAttribute('height', '100%')

		foreignObject.appendChild(this.element)
		this.svgElement.appendChild(foreignObject)

		addMouseListener(this.svgElement, this._onPointerDown, this._onPointerMove, this._onPointerUp)
		this.svgElement.addEventListener('contextmenu', this._onContextMenu)
		this._loadEmoji()

		let buttonImport = document.createElement('button')
		buttonImport.innerHTML = 'Import'
		buttonImport.classList.add('import')
		document.body.appendChild(buttonImport)

		let buttonExport = document.createElement('button')
		buttonExport.innerHTML = 'Export'
		buttonExport.classList.add('export')
		document.body.appendChild(buttonExport)

		if(!importExportModal)
		{
			importExportModal = document.createElement('div')
			importExportModal.dialogue = this
			let importExportModalText = document.createElement('textarea')
			importExportModal.classList.add('import_export_modal')
			importExportModalText.classList.add('import_export_modal_text')
			importExportModalText.value = 'Test input....'
			importExportModal.appendChild(importExportModalText)

			let importExportTitle = document.createElement('p')
			importExportTitle.innerHTML = 'Title'
			importExportModal.appendChild(importExportTitle)

			let importExportBtn = document.createElement('button')
			importExportBtn.innerHTML = 'Button'
			importExportModal.appendChild(importExportBtn)

			document.body.appendChild(importExportModal)
			addMouseListener(importExportBtn, this._onModalButtonPressed)
		}

		addMouseListener(buttonExport, (event) =>
		{
			importExportModal.classList.add('active')
			importExportModal.getElementsByTagName('textarea')[0].value = '{\n\t"nodes": [\n\n\t]\n}'
			importExportModal.getElementsByTagName('p')[0].innerHTML = 'Export'
			importExportModal.getElementsByTagName('textarea')[0].value = this.exportRaw()
			importExportModal.getElementsByTagName('button')[0].innerHTML = 'Copy to clipboard'
		})
		addMouseListener(buttonImport, (event) =>
		{
			importExportModal.classList.add('active')
			importExportModal.getElementsByTagName('textarea')[0].placeholder = 'Paste JSON here'
			importExportModal.getElementsByTagName('textarea')[0].value = ''
			importExportModal.getElementsByTagName('p')[0].innerHTML = 'Import'
			importExportModal.getElementsByTagName('button')[0].innerHTML = 'Import'
		})
	}

	refresh()
	{
		// Add nodes as children
		if(!this.nodes)
			return
		for(let i = 0; i < this.nodes.length; i++)
		{
			if(!this.nodes[i])
				continue
			if(!(this.nodes[i] instanceof NodeUI))
				this.nodes[i] = NodeUI.fromNode(this.nodes[i])
			this.nodes[i].refresh()

			if(!this.nodes[i].position.x)
			{
				let nodeWidthValue = DialogueUI.getCSSValue(currentTheme.nodeWidth, 'width', document.body)
				this.nodes[i].position.x = (nodeWidthValue * 1.25 * this.nodes[i].id) + 100
				this.nodes[i].position.y = 100
			}
			this.element.appendChild(this.nodes[i].dom())
		}

		for(let i = 0; i < this.nodes.length; i++)
		{
			for(let j = 0; j < this.nodes[i].options.length; j++)
			{
				this.nodes[i].disconnect(j, false)
				if(this.nodes[i].options[j].next < 0)
					continue
				try { this.nodes[i].connectTo(j, this.nodes.find(x => x.id == this.nodes[i].options[j].next)) } catch(e) { console.log(`Couldn't find node to connect to - ${e}`) }
			}
		}
	}

	reset()
	{
		if(!this.nodes)
			return
		while(this.element.firstChild)
			this.element.removeChild(this.element.firstChild)
		this.nodes = []
	}

	_onPointerMove(event)
	{
		event.preventDefault()
		// if mouse is moving while node is target, but left bounds
		if(pointer.target && pointer.target._node)
			pointer.target._node._onPointerMove(event)

		if(currentPath)
			currentPath.setAttributeNS(undefined, 'd', getSVGPath({ x: pathStartNode.x, y: pathStartNode.y }, { x: event.pageX, y: event.pageY }))

		if(event.buttons == 4 || (event.buttons == 1 && /* event.target.classList.contains('dialogue') && */ !pointer.target)) // if scroll wheel is held
		{
			let nodes = document.getElementsByTagName('div')[0]
			if(nodes.dialogue)
				nodes = nodes.dialogue.nodes
			else
				return

			for(let i = 0; i < nodes.length; i++)
			{
				nodes[i].position.x += event.movementX
				nodes[i].position.y += event.movementY
				nodes[i].dom().style.left = `${nodes[i].position.x}px`
				nodes[i].dom().style.top = `${nodes[i].position.y}px`

				for(let j = 0; j < nodes[i].options.length; j++)
				{
					if(nodes[i].options[j].next < 0)
						continue
					nodes[i].disconnect(j, false)
					nodes[i].connectTo(j, nodes.find(x => x.id == nodes[i].options[j].next))
				}
			}
		}
	}

	_onPointerUp(event)
	{
		// if mouse is released while node is target, but left bounds
		if(pointer.target && pointer.target._node)
			pointer.target._node._onPointerUp(event)

		if(pathStartNode && currentPath)
		{
			pathStartNode = undefined

			currentPath.parentNode.removeChild(currentPath)
			currentPath = undefined
		}

		if(event.buttons == 4 || (event.buttons == 1 && event.target.classList.contains('dialogue') && !pointer.target)) // if scroll wheel is held
		{
			let nodes = document.getElementsByTagName('div')[0]
			if(nodes.dialogue)
				nodes = nodes.dialogue.nodes
			else
				return

			for(let i = 0; i < nodes.length; i++)
			{
				nodes[i].position.x += event.movementX
				nodes[i].position.y += event.movementY
				nodes[i].dom().style.left = `${nodes[i].position.x}px`
				nodes[i].dom().style.top = `${nodes[i].position.y}px`

				for(let j = 0; j < nodes[i].options.length; j++)
				{
					if(nodes[i].options[j].next < 0)
						continue
					nodes[i].disconnect(j, false)
					nodes[i].connectTo(j, nodes.find(x => x.id == nodes[i].options[j].next))
				}
			}
		}
	}

	_onPointerDown(event)
	{
		if(contextMenu && !DialogueUI.isChildOfClass(event.target, 'context_menu'))
			contextMenu.classList.remove('active')
		importExportModal.classList.remove('active')
	}

	_onContextMenu(event)
	{
		if(!event.target.dialogue)
			return
		event.preventDefault()
		console.log(event.target)

		let node = new NodeUI(event.target.dialogue, event.target.dialogue.nodes.length)
		node.position = { x: event.clientX, y: event.clientY }
		event.target.dialogue.nodes.push(node)
		event.target.dialogue.refresh()
		return false
	}

	_onModalButtonPressed(event)
	{
		let textarea = importExportModal.getElementsByTagName('textarea')[0]
		let content = textarea.value
		if(!content || content.trim() == '')
			return
		if(importExportModal.getElementsByTagName('p')[0].innerHTML == 'Import')
		{
			// Import
			importExportModal.dialogue.reset()
			importExportModal.dialogue.nodes = importExportModal.dialogue.importRaw(content)
			importExportModal.dialogue.refresh()
		}
		else
		{
			// Export
			textarea.select()
			document.execCommand('copy')
		}
	}

	_loadEmoji()
	{
		if(this.loadingEmoji)
			return
		this.loadingEmoji = true
		$.getJSON(EmojiDictionaryPath, (json) =>
		{
			this.emoji = json
			this.loadingEmoji = false
			console.log(`Loaded ${this.emoji.length} emoji\n\t${this.emoji[0]}`)
			this.refresh()
		})
	}

	// Returns an integer value (in pixels) of the CSS input
	// 	IMPORTANT: Doesn't handle percentages (%) unless 'styleName' and 'parentElement' are defined
	static getCSSValue(input, styleName = '', parentElement = undefined)
	{
		if(!input) return 0
		if(!isNaN(input))
			return input
		input = input.toLowerCase()
		if(input.endsWith('px'))
			return input.substring(0, input.length - 2)
		if(input.endsWith('vw') || input.endsWith('vh'))
			return (input.endsWith('vw') ? window.innerWidth : window.innerHeight) * 0.01 * parseInt(input.substring(0, input.length - 2))
		if(input.endsWith('%'))
		{
			if(!styleName || !parentElement)
				return 0
			return parentElement.style[styleName] * (parseInt(input.substring(input.length - 1)) / 100)
		}
		return 0
	}

	static changeTheme(theme)
	{
		if(!theme)
			theme = defaultTheme
		currentTheme = theme

		if(DialogueUI.getCSSValue(currentTheme.nodeWidth, 'width', document.body) < 150) currentTheme.nodeWidth = '150px'
		if(DialogueUI.getCSSValue(currentTheme.nodeHeight, 'height', document.body) < 125) currentTheme.nodeHeight = '125px'

		if(DialogueUI.getCSSValue(currentTheme.nodeConnectorSize) < 15) currentTheme.nodeHeight = '15px'

		setProperty('--foreground', theme.foreground || defaultTheme.foreground)
		setProperty('--background', theme.background || defaultTheme.background)
		setProperty('--font-size', theme.fontSize || defaultTheme.fontSize)

		setProperty('--node-width', theme.nodeWidth || defaultTheme.nodeWidth)
		setProperty('--node-height', theme.nodeHeight || defaultTheme.nodeHeight)
		setProperty('--node-background', theme.nodeBackground || defaultTheme.nodeBackground)
		setProperty('--node-border-radius', theme.nodeBorderRadius || defaultTheme.nodeBorderRadius)
		setProperty('--node-border-width', theme.nodeBorderWidth || defaultTheme.nodeBorderWidth)
		setProperty('--node-border-colour', theme.nodeBorderColour || defaultTheme.nodeBorderColour)

		setProperty('--node-connector-size', theme.nodeConnectorSize || defaultTheme.nodeConnectorSize)
		setProperty('--node-connector-fill', theme.nodeConnectorFill || defaultTheme.nodeConnectorFill)
		setProperty('--node-connector-radius', theme.nodeConnectorRadius || defaultTheme.nodeConnectorRadius)

		setProperty('--context-width', (theme.context || defaultTheme.context).width)
		setProperty('--context-height', (theme.context || defaultTheme.context).height)
		setProperty('--context-background', (theme.context || defaultTheme.context).background)
		setProperty('--context-foreground', (theme.context || defaultTheme.context).foreground)
		setProperty('--context-border-radius', (theme.context || defaultTheme.context).borderRadius)
		setProperty('--context-border-colour', (theme.context || defaultTheme.context).borderColour)
		setProperty('--context-border-width', (theme.context || defaultTheme.context).borderWidth)

		setProperty('--scrollbar-width', (theme.scrollbar || defaultTheme.scrollbar).width)
		setProperty('--scrollbar-background', (theme.scrollbar || defaultTheme.scrollbar).background)
		setProperty('--scrollbar-thumb-colour', (theme.scrollbar || defaultTheme.scrollbar).thumbColour)
		setProperty('--scrollbar-thumb-colour-hover', (theme.scrollbar || defaultTheme.scrollbar).thumbColourHover)

		theme.context.emojiList = (theme.context ? theme.context.emojiList : undefined) || defaultTheme.context.emojiList
		setProperty('--emoji-list-border-width', theme.context.emojiList.borderWidth || defaultTheme.context.emojiList.borderWidth)
		setProperty('--emoji-list-border-radius', theme.context.emojiList.borderRadius || defaultTheme.context.emojiList.borderRadius)
		setProperty('--emoji-list-border-background', theme.context.emojiList.background || defaultTheme.context.emojiList.background)

		theme.context.emojiList.items = (theme.context ? (theme.context.emojiList ? theme.context.emojiList.items : undefined) : undefined) || defaultTheme.emojiList.items
		setProperty('--emoji-list-emoji-border-width', theme.context.emojiList.items.borderWidth || defaultTheme.context.emojiList.items.borderWidth)
		setProperty('--emoji-list-emoji-background', theme.context.emojiList.items.background || defaultTheme.context.emojiList.items.background)
		setProperty('--emoji-list-emoji-border-colour', theme.context.emojiList.items.borderColour || defaultTheme.context.emojiList.items.borderColour)
		setProperty('--emoji-list-emoji-background-hover', theme.context.emojiList.items.backgroundHover || defaultTheme.context.emojiList.items.backgroundHover)
		setProperty('--emoji-list-emoji-background-active', theme.context.emojiList.backgroundActive || defaultTheme.context.emojiList.backgroundActive)

		setProperty('--node-path-size', theme.nodePathSize || defaultTheme.nodePathSize)
		setProperty('--node-path-colour', theme.nodePathColour || defaultTheme.nodePathColour)
	}

	static isChildOf(element, parent)
	{
		if(element == parent)
			return true
		while(element = element.parentNode)
			if(DialogueUI.isChildOf(element, parent))
				return true
		return false
	}

	static isChildOfClass(element, parentClass)
	{
		if(!element.classList)
			return false
		if(element.classList.contains(parentClass))
			return true
		while(element = element.parentNode)
			if(DialogueUI.isChildOfClass(element, parentClass))
				return true
		return false
	}

	// Returns array of nodes imported from JSON 'text'
	importRaw(text)
	{
		try {
			let json = JSON.parse(text)
			let nodes = []
			for(let i = 0; i < json.nodes.length; i++)
			{
				let node = new NodeUI(this, json.nodes[i].id)
				node.content = json.nodes[i].content
				node.position = json.nodes[i].position
				node.inputs = []
				for(let j = 0; j < json.nodes[i].inputs.length; j++)
					node.inputs.push({
						id: json.nodes[i].inputs[j].id,
						option: json.nodes[i].inputs[j].option,
						node: node
					})

				node.options = []
				for(let j = 0; j < json.nodes[i].options.length; j++)
					node.options.push(new NodeOption(json.nodes[i].id,
												json.nodes[i].options[j].emoji,
												json.nodes[i].options[j].next,
												json.nodes[i].options[j].content
												))
				nodes.push(node)
			}
			return nodes
		} catch(e) { console.log(`Invalid JSON - ${e}`) }
		return []
	}

	// Returns JSON string
	exportRaw()
	{
		let exporting = { nodes: [] }
		for(let i = 0; i < this.nodes.length; i++)
		{
			let node = {
				id: this.nodes[i].id,
				content: this.nodes[i].content,
				position: this.nodes[i].position,
				inputs: [],
				options: []
			}
			for(let j = 0; j < this.nodes[i].inputs.length; j++)
				node.inputs.push({
					id: this.nodes[i].inputs[j].id,
					option: this.nodes[i].inputs[j].option
				})
			for(let j = 0; j < this.nodes[i].options.length; j++)
				node.options.push({
					content: this.nodes[i].options[j].content,
					next: this.nodes[i].options[j].next,
					emoji: this.nodes[i].options[j].emojiIndex
				})

			exporting.nodes.push(node)
		}
		return JSON.stringify(exporting)
	}
}

class NodeUI extends Node
{
	constructor(parent, id)
	{
		super(id)
		this.parent = parent
		this._dom = undefined
	}

	refresh()
	{
		if(!this._dom)
			return
		try { this.parent.element.removeChild(this._dom) } catch { }
		this._dom = undefined

		for(let i = 0; i < this.options.length; i++)
			this.disconnect(i, false)
	}

	dom()
	{
		if(!this._dom)
		{
			this._dom = document.createElement('div')
			this._dom.classList.add('node')
			this._dom.style.left = `${this.position.x}px`
			this._dom.style.top = `${this.position.y}px`

			// Setup event handling
			addMouseListener(this._dom, this._onPointerDown, this._onPointerMove, this._onPointerUp)

			// Set up the dialogue content
			let content = document.createElement('textarea')
			content.classList.add('node_content')
			content.placeholder = 'Dialogue content'
			content.value = this.content
			content._node = this
			content._nodeType = 'content'
			content.addEventListener('change', (event) => event.target._node.content = event.target.value)
			content.addEventListener('keyup', (event) => event.target._node.content = event.target.value)
			this._dom.appendChild(content)

			let removeButton = document.createElement('button')
			removeButton.classList.add('node_remove')
			removeButton.innerHTML = 'Remove'
			removeButton._node = this
			addMouseListener(removeButton, (event) =>
			{
				event.target._node.refresh() // remove DOM elements
				event.target._node.parent.nodes = event.target._node.parent.nodes.filter(x => x.id != event.target._node.id)
			})
			this._dom.appendChild(removeButton)
			
			// Set up the input circle
			let inputCircle = document.createElement('div')
			inputCircle._node = this
			inputCircle._nodeType = 'input'
			inputCircle.classList.add('node_input')
			inputCircle.classList.add('node_connector')
			addMouseListener(inputCircle, undefined, undefined, this._onInputPointerUp)

			this._dom.appendChild(inputCircle)

			// Set up the output circles
			if(this.options.length > 4)
				this.options.length = 4
			for(let i = 0; i < (this.options.length < 4 ? (this.options.length + 1) : this.options.length); i++)
			{
				let outputCircle = document.createElement('p')
				outputCircle._node = this
				outputCircle._optionIndex = i
				outputCircle._nodeType = 'output'
				outputCircle.innerHTML = i < this.options.length ? this.parent.emoji[this.options[i].emojiIndex] : '+'
				outputCircle.classList.add('node_output')
				outputCircle.classList.add('node_connector')
				outputCircle.style.top =  `${i * DialogueUI.getCSSValue(currentTheme.nodeConnectorSize || defaultTheme.nodeConnectorSize) + 10 * i}px`

				if(i < this.options.length)
				{
					addMouseListener(outputCircle, this._onOutputPointerDown)
					outputCircle.addEventListener('contextmenu', this._onOutputContextMenu, false)
					this.options[i].element = outputCircle
				}
				else
					addMouseListener(outputCircle, (event) =>
					{
						event.preventDefault()
						if(!event.target._node || event.target._optionIndex == undefined)
							return
						event.target._node.options.push(new NodeOption(event.target._node.id))
						event.target._node.parent.refresh()
					})

				this._dom.appendChild(outputCircle)
			}
			for(let i = 0; i < this.options.length; i++)
			{
				if(this.options[i].next < 0)
					continue
				let nextNode = this.parent.nodes.find(x => x.id == this.options[i].next)
				if(!nextNode)
				{
					console.log(`Couldn't find parent node #${this.options[i].next}`)
					continue
				}
				this.connectTo(i, nextNode)
			}
		}

		this._dom._node = this
		this._dom._nodeType = 'node'
		return this._dom
	}

	inputPoint()
	{
		let input = this.dom().getElementsByClassName('node_input')[0]
		let rect = input.getBoundingClientRect()
		return { x: rect.x + rect.width / 2 + window.scrollX, y: rect.y + rect.height / 2 + input.scrollTop }
	}

	outputPoint(optionIndex)
	{
		if(optionIndex >= this.options.length)
			return
		let outputs = this.dom().getElementsByClassName('node_output')
		let output = outputs[optionIndex]
		let rect = output.getBoundingClientRect()
		return { x: rect.x + rect.width / 2 + window.scrollX, y: rect.y + rect.height / 2 + output.scrollTop }
	}

	connectTo(optionIndex, node)
	{
		if(!(node instanceof NodeUI) || optionIndex >= this.options.length || node.id == this.id)
			return

		this.disconnect(optionIndex) // remove any previously drawn paths

		this.options[optionIndex].next = node.id
		this.options[optionIndex].nextNode = node
		this.options[optionIndex].nextNode.inputs.push({
			id: this.id,
			node: this,
			option: optionIndex
		})

		let rect = this.dom().getBoundingClientRect()
		pathStartNode = { x: rect.x + rect.width / 2 + this.dom().scrollLeft, y: rect.y + rect.height / 2 + this.dom().scrollTop, node: node }
		this.options[optionIndex].path = document.createElementNS(svgNS, 'path')
		this.options[optionIndex].path.setAttributeNS(undefined, 'd', getSVGPath(this.outputPoint(optionIndex), node.inputPoint()))
		this.parent.svgElement.prepend(this.options[optionIndex].path)
	}

	disconnect(optionIndex, removeNext = true)
	{
		if(this.options[optionIndex].next == undefined || !this.options[optionIndex].nextNode)
			return

		let inputs = this.options[optionIndex].nextNode.inputs
		for(let i = 0; i < inputs.length; i++)
		{
			if(inputs[i].id == this.id && inputs[i].option == optionIndex)
			{
				this.options[optionIndex].nextNode.inputs = inputs.splice(i, 1)
				break
			}
		}

		if(this.options[optionIndex].path)
		{
			this.parent.svgElement.removeChild(this.options[optionIndex].path)
			this.options[optionIndex].path = undefined
		}
		if(removeNext)
			this.options[optionIndex].next = -1
		this.options[optionIndex].nextNode = undefined
	}

	updateEmoji(optionIndex, emojiIndex)
	{
		let emojis = contextMenu.getElementsByClassName('context_emoji_list')[0].children
		emojis[this.options[optionIndex].emojiIndex].classList.remove('active_emoji')

		this.options[optionIndex].element.innerHTML = this.parent.emoji[emojiIndex]
		this.options[optionIndex].emojiIndex = emojiIndex

		emojis[this.options[optionIndex].emojiIndex].classList.add('active_emoji')
	}

	_onPointerUp(event)
	{
		if(!pointer.target)
			return
		// console.log(`_onPointerUp(${pointer.target._node.id})`)

		if(pointer.target._nodeType && pointer.target._nodeType == 'node')
		{
			pointer.target._node.position.x = pointer.tempX || pointer.targetX
			pointer.target._node.position.y = pointer.tempY || pointer.targetY

			pointer.target.style.left = `${pointer.target._node.position.x}px`
			pointer.target.style.top  = `${pointer.target._node.position.y}px`
		}

		pointer.target = undefined
		pointer.origin = { x: 0, y: 0 }
		pointer.tempX = pointer.tempY = pointer.targetX = pointer.targetY = 0
	}

	_onPointerDown(event)
	{
		if(event.button != 0) // only continue if left mouse button is pressed
			return
		if(contextMenu && !DialogueUI.isChildOfClass(event.target, 'context_menu'))
			contextMenu.classList.remove('active')
		if(pointer.target)
			return
		pointer.target = event.target
		if(pointer.target._nodeType == 'content')
			return
		else
		{
			// Remove any text selection (e.g. highlighted text in content)
			if (window.getSelection) {window.getSelection().removeAllRanges();}
 			else if (document.selection) {document.selection.empty();}
		}
		pointer.targetX = pointer.target._node.position.x
		pointer.targetY = pointer.target._node.position.y
		pointer.origin = getPointFromEvent(event)
		// console.log(`_onPointerDown(${pointer.target._node.id})`)
	}

	_onPointerMove(event)
	{
		if(!pointer.target || !pointer.target._node || (pointer.target._nodeType && pointer.target._nodeType != 'node'))
			return
		event.preventDefault()
		// console.log(`Node._onPointerMove(${pointer.target._node.id})`)

		let pointerPosition = getPointFromEvent(event)
		pointer.tempX = pointer.targetX + (pointerPosition.x - pointer.origin.x)
		pointer.tempY = pointer.targetY + (pointerPosition.y - pointer.origin.y)

		pointer.target.style.left = `${pointer.tempX}px`
		pointer.target.style.top  = `${pointer.tempY}px`

		// Move output point paths
		for(let i = 0; i < pointer.target._node.options.length; i++)
			if(pointer.target._node.options[i].path && pointer.target._node.options[i].nextNode)
				pointer.target._node.options[i].path.setAttributeNS(undefined, 'd', getSVGPath(pointer.target._node.outputPoint(i), pointer.target._node.options[i].nextNode.inputPoint()))
		// Move input point paths
		let inputs = pointer.target._node.inputs
		for(let i = 0; i < inputs.length; i++)
			if(inputs[i].node.options[inputs[i].option].path)
				inputs[i].node.options[inputs[i].option].path.setAttributeNS(undefined, 'd', getSVGPath(inputs[i].node.outputPoint(inputs[i].option), pointer.target._node.inputPoint()))
	}

	_onOutputPointerDown(event)
	{
		if(event.target._optionIndex == undefined || event.button != 0)  // only continue if left mouse button is pressed
			return

		if(event.target._node.options[event.target._optionIndex].nextNode)
			event.target._node.disconnect(event.target._optionIndex)

		let rect = event.target.getBoundingClientRect()
		pathStartNode =
		{
			x: rect.x + rect.width / 2,
			y: rect.y + rect.height / 2,
			node: event.target._node,
			optionIndex: event.target._optionIndex
		}
		currentPath = document.createElementNS(svgNS, 'path')
		event.target._node.parent.svgElement.prepend(currentPath)
	}

	_onInputPointerUp(event)
	{
		if(!pathStartNode)
			return
		pathStartNode.node.connectTo(pathStartNode.optionIndex, event.target._node)

		event.target._node.parent.svgElement.removeChild(currentPath)
		pathStartNode = undefined
		currentPath = undefined
	}

	_onOutputContextMenu(event)
	{
		event.preventDefault()
		if(event.target._optionIndex == undefined)
			return true // continue with regular context menu
		contextTarget = event.target

		if(!contextMenu)
		{
			contextMenu = document.createElement('div')
			contextMenu.classList.add('context_menu')

			let contentInput = document.createElement('input')
			contentInput.placeholder = 'Option text...'
			contentInput.value = contextTarget._node.content
			contentInput.classList.add('context_search')
			contentInput.addEventListener('change', (event) =>
			{
				contextTarget._node.options[contextTarget._optionIndex].content = event.target.value
			})
			contextMenu.appendChild(contentInput)

			let removeButton = document.createElement('button')
			removeButton.innerHTML = 'Remove'
			removeButton.classList.add('context_button_remove')
			removeButton.addEventListener('click', () =>
			{
				if(contextTarget._node.options[contextTarget._optionIndex].path)
					// svgElement.appendChild(this.options[optionIndex].path)
					// svgElement.removeChild(contextTarget._node.options[contextTarget._optionIndex].path)
					contextTarget._node.disconnect(contextTarget._optionIndex)
				contextTarget._node.options.splice(contextTarget._optionIndex, 1)
				contextTarget._node.parent.refresh()
				contextMenu.classList.remove('active')
			})
			contextMenu.appendChild(removeButton)

			let emojiList = document.createElement('div')
			emojiList.classList.add('context_emoji_list')

			let emojiPerLine = 4
			let emojiWidth = (DialogueUI.getCSSValue((currentTheme.context || defaultTheme.context).width) - 30 - (emojiPerLine * 10)) / emojiPerLine
			for(let i = 0; i < event.target._node.parent.emoji.length; i++)
			{
				let btnEmoji = document.createElement('button')
				btnEmoji.innerHTML = event.target._node.parent.emoji[i]

				btnEmoji.style.width = btnEmoji.style.height = `${emojiWidth}px`
				btnEmoji.style.left = `${10 + (i % emojiPerLine) * emojiWidth + (10 * (i % emojiPerLine))}px`
				btnEmoji.style.top  = `${10 + (i - (i % emojiPerLine)) * ((emojiWidth + 10) / emojiPerLine)}px`

				btnEmoji.addEventListener('click', () => contextTarget._node.updateEmoji(contextTarget._optionIndex, i))
				emojiList.appendChild(btnEmoji)
			}
			contextMenu.appendChild(emojiList)

			document.body.appendChild(contextMenu)
		}

		let rect = contextTarget.getBoundingClientRect(), connectorSize = DialogueUI.getCSSValue(currentTheme.nodeConnectorSize)
		contextMenu.style.left = `${rect.left + connectorSize / 2}px`
		contextMenu.style.top = `${rect.top + connectorSize / 2}px`
		contextMenu.classList.add('active')

		let emojis = contextMenu.getElementsByClassName('context_emoji_list')[0].children
		for(let i = 0; i < emojis.length; i++)
		{
			if(contextTarget._node.options[contextTarget._optionIndex].emojiIndex == i)
				emojis[i].classList.add('active_emoji')
			else
				emojis[i].classList.remove('active_emoji')
		}

		contextMenu.getElementsByTagName('input')[0].value = contextTarget._node.options[contextTarget._optionIndex].content || ''

		return false
	}

	static fromNode(node)
	{
		let newNode = new NodeUI(node.id, node.previous)
		newNode.position = node.position
		newNode.content = node.content
		newNode.options = node.options
		return newNode
	}
}
