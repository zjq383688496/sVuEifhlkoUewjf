const Koa      = require('koa')
const json     = require('koa-json')
const body     = require('koa-body')
const wsServer = require('./wsServer')
const app      = wsServer(new Koa())

// 错误处理
// onerror(app)

// 中间件
app.use(body({
	multipart: true,
	formidable: {
		maxFileSize: 200 * 1024 * 1024,
		hash: 'md5',
	}
}))
app.use(json())

// 路由 & websocket
require('./config.routes')(app)
require('./config.ws')(app)

// error-handling
app.on('error', (err, ctx) => {
	console.error('服务器 错误', err, ctx)
})

module.exports = app
