const WebSocket = require('ws')
const WebSocketServer = WebSocket.Server
const url = require('url')

function wsServer(app) {
	this.app = app
	this.middleware = []
}


module.exports = function middleware(app, wsOptions = {}) {
	const oldListen = app.listen
	app.listen = function listen(...args) {
		console.log('等待连接服务器...')
		app.server = oldListen.apply(app, args)
		const options = { server: app.server }
		if (wsOptions) {
			Object.keys(wsOptions).forEach((key) => {
				if (Object.prototype.hasOwnProperty.call(wsOptions, key)) {
					options[key] = wsOptions[key]
				}
			})
		}
		app.ws.listen(options)
		return app.server
	}
	app.ws = new wsServer(app)
	return app
}

Object.assign(wsServer.prototype, {
	listen: function(options) {
		this.server = new WebSocketServer(options)
		this.server.on('connection', this.onConnection.bind(this))
	},
	onConnection: async function(socket, req) {
		console.log('建立连接')
		socket.on('error', err => console.error('错误: ', err))
		const fn = await compose(this.middleware)
		const context = this.app.createContext(req)
		const { pathname } = url.parse(req.url)
		context.websocket = socket
		context.path = pathname

		fn(context).catch(err => console.error(err))
	},
	use: function(fn) {
		this.middleware.push(fn)
		return this
	}
})

function compose(middleware) {
	return function (context, next) {
		let index = -1
		return dispatch(0)
		function dispatch (i) {
			if (i <= index) return Promise.reject(new Error('next() called multiple times'))
			index = i
			let fn = middleware[i]
			if (i === middleware.length) fn = next
			if (!fn) return Promise.resolve()
			try {
				return Promise.resolve(fn(context, dispatch.bind(null, i + 1)))
			} catch (err) {
				return Promise.reject(err)
			}
		}
	}
}