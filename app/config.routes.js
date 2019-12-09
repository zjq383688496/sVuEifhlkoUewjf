const api = require('./api')

module.exports = app => {
	// 允许跨域
	// 添加请求处理时间(ms)
	app.use(async (ctx, next) => {
		const start = Date.now()
		ctx.set('Access-Control-Allow-Credentials', true)
		ctx.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type')
		ctx.set('Access-Control-Allow-Origin',  '*')
		ctx.set('Access-Control-Allow-Methods', 'GET,POST')
		ctx.set('Access-Control-Max-Age', 3600)
		if (ctx.method === 'OPTIONS') return ctx.body = ''
		await next()
		const ms = Date.now() - start
		ctx.set('x-execution-time', `${ctx.method} ${ctx.url} - ${ms}ms`)
	})

	app.use(api.routes(), api.allowedMethods())
}
