//
// div launcher
// |-- div inputContainer
// |   |-- input input
// |   |-- a speechButton
// |-- div container
// |   |-- a cmd1
// |   |-- a cmd2

if (!browser) var browser = chrome

let port = browser.runtime.connect({ name: 'port-from-cs' })

port.onMessage.addListener(({ command, data}) => {
  if (command === 'bookmarks') {
    loadBookmarks(null, data)
  }
})

let speechRecognitionIsRunning = false
let recognitionEnabled = false
let commands = []

let defaultCommands = [
  {
    text: 'New tab',
    message: 'newTab',
  },
  {
    text: 'Close tab',
    message: 'closeTab'
  },
  {
    text: 'New window',
    message: 'newWindow'
  },
  {
    text: 'Cancel',
    callback () {
    }
  },
  {
    text: 'View bookmarks',
    message: 'getBookmarks',
    cancelClose: true
  }
]

//
var links = document.getElementsByTagName('a')
var texts = {}
for (let i = 0; i < links.length; i++) {
  const link = links[i]
  if (!link || !link.innerText) {
    continue
  }
  const text = link.innerText.trim()
  if (text === '' || texts[text.toLowerCase()]) {
    continue
  }
  texts[text.toLowerCase()] = true
  defaultCommands.push({
    text: '@' + text.replace('\n', ' - '),
    callback () {
      link.click()
    },
    setBorder: () => {
      link.classList.add('selected-link')
    },
    clearBorder: () => {
      link.classList.remove('selected-link')
    }
  })
}

function loadDefaultCommands() {
  commands = defaultCommands
}

function loadBookmarks(parent, tree) {
  commands = []
  console.log(tree)
  commands.push({
    text: '..',
    callback() {
      if (parent) {
        commands = parent
      } else {
        loadDefaultCommands()
      }
    },
    cancelClose: true
  })
  for (let child of tree[0].children) {
    console.log('type', child)
    commands.push({
      text: child.title.trim() || '(no title)',
      callback () {
        if (child.children) {
          loadBookmarks(commands, [child])
        } else {
          window.open(child.url, '_self')
        }
      },
      cancelClose: (child.children != null)
    })
  }
}

if (!('webkitSpeechRecognition' in window)) {
  console.log("UPGRADE")
} else {
  var recognition = new webkitSpeechRecognition();
  recognitionEnabled = true
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onstart = function() {
    console.log('speech started')
  }
  recognition.onresult = function(event) {
    query = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      query += event.results[i][0].transcript
    }
    input.value = query;
    generateCommands()
  }
  recognition.onerror = function(event) {
    console.log('error: ', event)
  }
  recognition.onend = function() {
    console.log('speech ended')
  }
}

var css = `
#cmdlauncher {
  width: 400px;
  position: fixed;
  top: 0;
  left: 50%;
  transform: translate(-50%, 0);
  opacity: 1.0;
  box-shadow: 0 0 5px 8px rgba(0,0,0,0.2);
  border-radius: 5px;
  z-index: 99999999999999999999;
}

#cmdlauncher input {
  width: calc(88%);
  height: 48px;
  border: 0;
  font-size: 20px;
  padding-left: 10px;
  type: text;
  background-color: transparent;
  color: #eeeeee;
  outline: none;
  -webkit-appearance: none;
}

#cmdlauncher #input-container a {
  display: inline-block;
  margin: 0 5px;
}

#cmdlauncher #input-container {
  background-color: #2D6D7C;
  opacity: 0.95;
  margin: 0;
  padding: 0;
}

#cmdlauncher #container {
  max-height: 400px;
  overflow: hidden;
  overflow-y: scroll;
  background-color: #2D6D7C;
  opacity: 0.85;
  margin: 0;
  padding: 0;
}

#cmdlauncher #container a {
  display: block;
  padding: 15px;
  color: white;
  font-size: 14px;
  text-decoration: none;
  transition: all 0.3s;
}

#cmdlauncher #container a.selected {
  background-color: rgba(255,255,255,0.2);
}

#cmdlauncher #container a span.matched {
  font-weight: bolder;
  color: #E98B25;
}

.selected-link {
  background-color: rgba(255, 255, 0, 0.7);
  transition: background-color 0.5s;
}

`
var style = document.createElement('style');
var cancelFlag = false;

if (style['styleSheet']) {
    style['styleSheet'].cssText = css;
} else {
    style.appendChild(document.createTextNode(css));
}

document.getElementsByTagName('head')[0].appendChild(style);

interface Command {
  score: number,
  matches: number[],
  text: string,
  callback: (() => void),
  setBorder: (() => void),
  clearBorder: (() => void),
  cancelClose: boolean,
  elem: any
}

function score(query: string, command: any): Command {
  const matches: number[] = []
  let score = 0
  let j = 0
  let consecutive = true
  if (query !== '') {
    for (let i = 0; i < command.text.length; i++) {
      if (command.text[i].toLowerCase() === query[j].toLowerCase()) {
        score++
        if (consecutive) {
          score++;
        }
        matches.push(i)
        j++
        if (j === query.length) {
          break
        }
        consecutive = true
      } else {
        consecutive = false
      }
    }
  }
  return {
    score,
    matches,
    text: command.text,
    callback: command.callback || (() => {
      port.postMessage(command.message)
    }),
    setBorder: command.setBorder || (() => {}),
    clearBorder: command.clearBorder || (() => {}),
    cancelClose: command.cancelClose || false,
    elem: document.createElement('a')
  }
}

let scoredCommands: Command[] = []
let query = ""
let commandIndex = 0
let focused = false

const launcher = document.createElement('div')
launcher.style.visibility = 'hidden'
launcher.id = 'cmdlauncher'
document.body.appendChild(launcher)

const inputContainer = document.createElement('div')
inputContainer.id = 'input-container'
launcher.appendChild(inputContainer)

const input = document.createElement('input')
input.autocomplete = 'off'
input['autocorrect'] = 'off'
input['spellcheck'] = false
input.addEventListener('blur', closeLauncher)
input.addEventListener('keyup', (_) => {
  const oldQuery = query
  query = input['value']
  if (query !== oldQuery) {
    commandIndex = 0
  }
  generateCommands()
})

input.placeholder = 'Enter a command...'

inputContainer.appendChild(input)

if (recognitionEnabled) {
  const speechButton = document.createElement('a')
  speechButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#fff" d="M12 2c1.103 0 2 .897 2 2v7c0 1.103-.897 2-2 2s-2-.897-2-2v-7c0-1.103.897-2 2-2zm0-2c-2.209 0-4 1.791-4 4v7c0 2.209 1.791 4 4 4s4-1.791 4-4v-7c0-2.209-1.791-4-4-4zm8 9v2c0 4.418-3.582 8-8 8s-8-3.582-8-8v-2h2v2c0 3.309 2.691 6 6 6s6-2.691 6-6v-2h2zm-7 13v-2h-2v2h-4v2h10v-2h-4z"/></svg>`
  speechButton.addEventListener('click', onSpeechClick)
  inputContainer.appendChild(speechButton)
}

let container = null


function generateCommands() {
  // Generate the container
  if (container) {
    launcher.removeChild(container)
  }
  container = document.createElement('div')
  container.id = 'container'
  launcher.appendChild(container)

  // Calculate the score of each command
  scoredCommands = commands.map((cmd) => score(query, cmd))
  scoredCommands.sort((x, y) => y.score - x.score)

  // Add the commands
  let i = 0;
  for (let cmd of scoredCommands.slice(0, 30)) {
    cmd.elem.innerHTML = ''
    let j = 0;
    let k = 0;
    for (let char of cmd.text) {
      let span = document.createElement('span')
      span.innerText = char
      if (k < cmd.matches.length && j == cmd.matches[k]) {
        span.classList.add('matched')
        k++
      }
      cmd.elem.appendChild(span)
      j++;
    }
    container.appendChild(cmd.elem)
    i += 1
  }
  if (scoredCommands[commandIndex]) {
    scoredCommands.forEach(cmd => cmd.clearBorder())
    scoredCommands[commandIndex].setBorder()
  }
  updateSelected()
}

function openLauncher() {
  cancelFlag = false;
  launcher.style.visibility = "visible"
  input.focus()
  focused = true
  generateCommands()
}

function closeLauncher() {
  console.log('will set timout', cancelFlag)
  const f = () => {
    if (cancelFlag) {
      cancelFlag = false
    } else {
      launcher.style.visibility = "hidden"
      input['value'] = ''
      query = ''
      focused = false
      if (recognitionEnabled) {
        recognition.stop()
        speechRecognitionIsRunning = false
      }
      loadDefaultCommands()
      generateCommands()
      scoredCommands.forEach(c => c.clearBorder())
    }
  }
  if (recognitionEnabled) {
    setTimeout(f, 200)
  } else {
    f()
  }
}

function updateSelected () {
  let i = 0
  for (let cmd of scoredCommands.slice(0, 30)) {
    if (i === commandIndex) {
      cmd.elem.classList.add('selected')
    } else {
      cmd.elem.classList.remove('selected')
    }
    i++
  }
}

function onKeyPress(e) {
  if (focused) {
    if (e.key === 'ArrowDown') {
      commandIndex = (commandIndex + 1) % commands.length
      updateSelected()
    } else if (e.key === 'ArrowUp') {
      commandIndex = ((commandIndex - 1) + commands.length) % commands.length
      updateSelected()
    } else if (e.key === 'Enter') {
      scoredCommands[commandIndex].callback()
      console.log('cancel close',scoredCommands[commandIndex].cancelClose)
      console.log('scoredCommands', scoredCommands[commandIndex])
      if (scoredCommands[commandIndex].cancelClose) {
        commandIndex = 0
        query = ''
        input.value = ''
      } else {
        closeLauncher()
      }
    } else if (e.ctrlKey && e.key === 'e' || e.key === 'F2') {
      closeLauncher()
    }
  } else {
    if (e.ctrlKey && e.key === 'e' || e.key === 'F2') {
      openLauncher()
      e.stopPropagation()
    }
  }
}

function onSpeechClick() {
  if (recognitionEnabled) {
    if (speechRecognitionIsRunning) {
      recognition.stop()
      speechRecognitionIsRunning = false;
    } else {
      recognition.start()
      speechRecognitionIsRunning = true;
    }
  }
  cancelFlag = true;
}

loadDefaultCommands()

window.addEventListener('keydown', onKeyPress)
