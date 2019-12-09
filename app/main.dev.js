const electron = require('electron')

// 启动node服务
// require('./bin/www')

const { app, BrowserWindow, ipcMain, screen } = electron

let mainWin

const PROTOCOL = 'rymaterial'

class WinDeskTop {
	constructor() {
		this.app = app
		this.appListen()
		this.init()
	}

	// 监听app
	appListen() {
		// 退出
		this.app.on('window-all-closed', async () => {
			mainWin = null
			this.app.quit()
		})
		// 准备好
		this.app.on('ready', async () => {
			this.createWin()
		})
		// macOS 下通过协议URL启动时，主实例会通过 open-url 事件接收这个 URL
		this.app.on('open-url', (event, urlStr) => {
			mainWin && mainWin.webContents.send('get-update', paramFormat(urlStr))
		})
	}

	init() {
		// 只允许又一个实例
		if (!this.app.requestSingleInstanceLock()) {
			return this.app.quit()
		}
		this.app.setAsDefaultProtocolClient(PROTOCOL, process.execPath)
	}

	createWin() {
		let { width, height } = screen.getPrimaryDisplay().workAreaSize,
			w = 400,
			h = 120
		console.log(width, height)
		mainWin = new BrowserWindow({
			width:  w,
			height: h,
			x: width - w,
			y: height - h,
			transparent: true,
			resizable: false,
			closable: false,
			minimizable: false,
			fullscreenable: false,
			titleBarStyle: 'hidden',
			// backgroundColor: 'transparent',
			webPreferences: {
				nodeIntegration: true,
			},
		})

		// 禁用缩放系统
		var { webContents } = mainWin

		mainWin.loadURL(`file://${__dirname}/page/upload/index.html`)
		mainWin.once('ready-to-show', () => {
			mainWin.show()
		})
		mainWin.once('closed', () => {
			mainWin = null
		})
	}
}

new WinDeskTop()

process.on('uncaughtException', ({ message }) => {
	console.log('uncaughtException', message)
})

process.on('error', ({ message }) => {
	console.log('error', message)
})

function paramFormat(str) {
	const param = {}
	str.replace(/(\?|&)([^&]+)=([^&]+)/g, (s, i, key, val) => {
		param[key] = /\d+/.test(val)? +val: val
	})
	return param
}