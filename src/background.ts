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
		browser.bookmarks.getTree((data) => {
      console.log('data', data)
			portFromCS.postMessage({
				command: 'bookmarks',
				data
			})
		})
	}
}

function notify(p) {
	portFromCS = p
	portFromCS.onMessage.addListener((name) => {
		actions[name]()
	})
}
