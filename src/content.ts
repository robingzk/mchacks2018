//
// div launcher
// |-- input input
// |-- div container
//     |-- a cmd1
//     |-- a cmd2

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
	backgroundColor: '#39264F',
	position: 'fixed',
	top: '0',
	left: '50%',
	transform: 'translate(-50%, 0)',
	padding: '5px',
	opacity: '0.95',
	boxShadow: '0 0 5px 8px rgba(0,0,0,0.2)',
	borderRadius: '5px',
	zIndex: '100000'
})
document.body.appendChild(launcher)

const input = createElem('input', {
	placeholder: 'Enter a command',
	width: '100%',
	height: '48px',
	border: '0',
	fontSize: '20px',
	marginLeft: '10px',
	backgroundColor: 'transparent',
	color: '#eeeeee'
})
input.addEventListener('blur', closeLauncher)
launcher.appendChild(input)

const container = createElem('div', {
	margin: '5px 0'
})
launcher.appendChild(container)

generateCommands(commands)

function generateCommands(cmds: string[]) {
	let i = 0;
	for (let cmd of cmds) {
		let style = {
			display: 'block',
			padding: '15px',
			color: 'white'
		}
		if (i === commandIndex) {
			style['backgroundColor'] = '#614F75'
			style['color'] = '#fff'
		}
		const cmdElem = createElem('a', style)
		cmdElem.innerText = cmd
		container.appendChild(cmdElem)
		i += 1
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