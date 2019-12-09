const upyun = require('upyun')
const { bucket, user, pass }  = require('./config').upyun
const service = new upyun.Service(bucket, user, pass)
const client  = new upyun.Client(service)

module.exports = {
	setProgress: function(progress, message) {
		const data = JSON.stringify({ progress, message })
		global.WS.upClient.send(data)
	},
	upyun: client
}