
// setInterval(() => {
// 	browser.windows.open()
// }, 2000)
if (!browser) var browser = chrome

console.log("BACKGROUND SCRIPT")
browser.runtime.onMessage.addListener(notify)

const actions = {
	newWindow () {
		browser.windows.create()
	}
}

function notify(name) {
	console.log("RECEIVED MESSAGE")
  // browser.notifications.create({
  //   "type": "basic",
  //   "title": "You clicked a link!",
  //   "message": 'HELLO'
  // });
	actions[name]()
}
