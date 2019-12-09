const route = require('koa-route')

const WS = global.WS = {}

module.exports = app => {
	// websocket相关
	app.ws.use(function(ctx, next) {
		return next(ctx)
	})

	/* 上传进度条 */
	// 客户端
	app.ws.use(route.all('/uploadProgress/client', ctx => {
		WS.upClient = ctx.websocket
	}))

}
