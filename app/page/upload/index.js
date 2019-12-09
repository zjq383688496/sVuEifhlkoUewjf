var { round } = Math
var ws_up_progress = clientWebSocket('ws://127.0.0.1:4099/uploadProgress/client', up_progress)

var $section  = document.querySelector('.section'),
	$progress = document.querySelector('#progress'),
	$message  = document.querySelector('#message')

// 响应收到的消息
function up_progress(data) {
	if (!data.progress) {
		console.log(data.progress)
		$section.removeAttribute('style')
	}
	setProgress(data)
}

// 创建websocket客户端
function clientWebSocket(url, messageFn) {
	var ws = new WebSocket(url)
	ws.onopen = function () {
		console.log(`[CLIENT] open`)
	}

	ws.onmessage = function({ data }) {
		if (!data) return
		var params = JSON.parse(data)
		messageFn && messageFn(params)
	}

	ws.onerror = function(err) {
		console.log(`[CLIENT] error`)
	}

	ws.onclose = function(msg) {
		console.log(`[CLIENT] close`)
	}

	return ws
}

function setProgress({ progress, message }) {
	$progress.style.width = `${progress}%`
	$progress.setAttribute('data-progress', progress)
	if (message) {
		var txt = document.createElement('p')
		txt.innerText = message
		$message.prepend(txt)
	}
}