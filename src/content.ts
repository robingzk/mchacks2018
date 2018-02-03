//
// div launcher
// |-- div inputContainer
// |   |-- input input
// |   |-- a speechButton
// |-- div container
// |   |-- a cmd1
// |   |-- a cmd2

let speechRecognitionEnabled = true

if (!('webkitSpeechRecognition' in window)) {
  console.log("UPGRADE")
} else {
  var recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onstart = function() {
    console.log('speech started')
  }
  recognition.onresult = function(event) {
    query = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      //let notFinal = '';
      //if (event.results[i].isFinal) query += event.results[i][0].transcript
      //else query += event.results[i][0].transcript
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
#launcher {
  width: 400px;
  background-color: #39264F;
  position: fixed;
  top: 0;
  left: 50%;
  transform: translate(-50%, 0);
  padding-left: 5px;
  opacity: 0.95;
  box-shadow: 0 0 5px 8px rgba(0,0,0,0.2);
  border-radius: 5px;
  z-index: 100000;
}

#launcher input {
  width: calc(88%);
  height: 48px;
  border: 0;
  font-size: 20px;
  margin-left: 10px;
  type: text;
  background-color: transparent;
  color: #eeeeee;
  outline: none;
  -webkit-appearance: none;
}

#input-container a {
  display: inline-block;
  margin: 0 5px;
}

#container a {
  display: block;
  padding: 15px;
  color: white;
  font-size: 14px;
  text-decoration: none;
}

#container a.selected {
  background-color: #614F75;
  color: #fff;
}

#container a span.matched {
  text-decoration: underline;
  font-weight: bold;
  color: #65CBCB;
}

`
var style = document.createElement('style');

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
  callback: (() => void)
}

function score(query: string, command: any): Command {
  const matches: number[] = []
  let score = 0
  let j = 0
  if (query !== '') {
    for (let i = 0; i < command.text.length; i++) {
      if (command.text[i].toLowerCase() === query[j].toLowerCase()) {
        score++
        matches.push(i)
        j++
        if (j === query.length) {
          break
        }
      }
    }
  }
  return {
    score,
    matches,
    text: command.text,
    callback: command.callback
  }
}

const commands = [
  {
    text: 'New tab',
    callback () {
      window.open('', '_blank')
    }
  },
  {
    text: 'New window',
    callback () {
      window.open('')
    }
  },
]
let scoredCommands: Command[] = []
let query = ""
let commandIndex = 0
let focused = false

function createElem(tag: string, style: object) {
  const elem = document.createElement(tag)
  for (let key in style) {
    if (style.hasOwnProperty(key)) {
      elem.style[key] = style[key]
    }
  }
  return elem
}

const launcher = document.createElement('div')
launcher.id = 'launcher'
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
  query = input['value']
  generateCommands()
})

inputContainer.appendChild(input)

if (speechRecognitionEnabled) {
  const speechButton = document.createElement('a')
  speechButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#fff" d="M12 2c1.103 0 2 .897 2 2v7c0 1.103-.897 2-2 2s-2-.897-2-2v-7c0-1.103.897-2 2-2zm0-2c-2.209 0-4 1.791-4 4v7c0 2.209 1.791 4 4 4s4-1.791 4-4v-7c0-2.209-1.791-4-4-4zm8 9v2c0 4.418-3.582 8-8 8s-8-3.582-8-8v-2h2v2c0 3.309 2.691 6 6 6s6-2.691 6-6v-2h2zm-7 13v-2h-2v2h-4v2h10v-2h-4z"/></svg>`
  inputContainer.appendChild(speechButton)
}

let container = null

generateCommands()

function generateCommands() {
  // Generate the container
  if (container) {
    launcher.removeChild(container)
  }
  container = createElem('div', {
    margin: '5px 0'
  })
  container.id = 'container'
  launcher.appendChild(container)

  // Calculate the score of each command
  scoredCommands = commands.map((cmd) => score(query, cmd))
  scoredCommands.sort((x, y) => y.score - x.score)

  // Add the commands
  let i = 0;
  for (let cmd of scoredCommands) {
    const cmdElem = document.createElement('a')
    if (i === commandIndex) {
      cmdElem.classList.add('selected')
    }
    let j = 0;
    let k = 0;
    for (let char of cmd.text) {
      let span = document.createElement('span')
      span.innerText = char
      if (k < cmd.matches.length && j == cmd.matches[k]) {
        //style['text-decoration'] = 'underline'
        span.classList.add('matched')
        k++
      }
      cmdElem.appendChild(span)
      j++;
    }
    container.appendChild(cmdElem)
    i += 1
  }
}

function openLauncher() {
  launcher.style.visibility = "visible"
  input.focus()
  recognition.start()
  focused = true
}

function closeLauncher() {
  launcher.style.visibility = "hidden"
  input['value'] = ''
  query = ''
  focused = false
  recognition.stop()
  generateCommands()
}

function onKeyPress(e) {
  if (focused) {
    if (e.key === 'ArrowDown') {
      commandIndex = (commandIndex + 1) % commands.length
      generateCommands()
    } else if (e.key === 'ArrowUp') {
      commandIndex = ((commandIndex - 1) + commands.length) % commands.length
      generateCommands()
    } else if (e.key === 'Enter') {
      scoredCommands[commandIndex].callback()
      closeLauncher()
    }
  } else {
    if (e.ctrlKey && e.key === 'e') {
      openLauncher()
      e.stopPropagation()
    }
  }
}

closeLauncher()
window.addEventListener('keydown', onKeyPress)
