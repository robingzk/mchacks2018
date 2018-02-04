if (!browser) var browser = chrome

let portFromCS

browser.runtime.onConnect.addListener(notify)

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
	},
	getBookmarks () {
		let tree = browser.bookmarks.getTree()
		portFromCS.postMessage({
			command: 'bookmarks',
			data: tree
		})
	}
}

function notify(p) {
	portFromCS = p
	portFromCS.onMessage.addListener((name) => {
		actions[name]()
	})
}
