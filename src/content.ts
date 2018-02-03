//
// launcher
// |-- input
// |-- container
//     |-- a cmd

const commands = ['New tab', 'Bookmark this page', 'Exit', 'Open bookmark...', 'New window']
const commandIndex = 0

function createElem(tag: string, style: object) {
	const elem = document.createElement(tag)
	for (let key in style) {
		if (style.hasOwnProperty(key)) {
			elem.style[key] = style[key]
		}
	}
	return elem
}

const launcher = createElem('div', {
	width: '400px',
	backgroundColor: 'blue',
	position: 'fixed',
	top: '0',
	left: '50%',
	transform: 'translate(-50%, 0)',
	padding: '5px'
})
document.body.appendChild(launcher)

const input = createElem('input', {
	placeholder: 'Enter a command',
	width: '100%',
	height: '40px',
	border: '0',
	fontSize: '18px'
})
input.addEventListener('blur', closeLauncher)
launcher.appendChild(input)

const container = createElem('div', {
	margin: '5px 0'
})
launcher.appendChild(container)

generateCommands(commands)

function generateCommands(cmds: string[]) {
	for (let cmd of cmds) {
		const cmdElem = createElem('a', {
			display: 'block',
			padding: '10px'
		})
		cmdElem.innerText = cmd
		container.appendChild(cmdElem)
	}
}

function openLauncher() {
	launcher.style.visibility = "visible"
	input.focus()
}

function closeLauncher() {
	launcher.style.visibility = "hidden"
}

function onKeyPress(e) {
	if (e.key === 'e') {
		openLauncher()
	}
}

closeLauncher()
window.addEventListener('keypress', onKeyPress)