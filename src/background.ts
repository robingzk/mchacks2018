
// setInterval(() => {
// 	browser.windows.open()
// }, 2000)
if (!browser) var browser = chrome

console.log("BACKGROUND SCRIPT")
browser.runtime.onMessage.addListener(notify)

const actions = {
	newWindow () {
		browser.windows.create()
	},
	newTab () {
		browser.tabs.create({})
	},
	closeTab () {
    browser.tabs.query({ currentWindow: true, active: true }, ([tab]) => {
      browser.tabs.remove(tab.id)
    });
	}
}

function notify(name) {
	actions[name]()
}
