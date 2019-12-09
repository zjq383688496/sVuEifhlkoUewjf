const { aes, upyun }      = require('../../utils')
const { envPath, ypHost } = require('../../config')

module.exports = (DATA, mallId) => {
	return new Promise((resolve, reject) => {
		var { name } = DATA
		var content = JSON.stringify(DATA),
			sign    = aes.encode(content),
			dir     = `${envPath}/map2d/${mallId}/${name}`
		return upyun.putFile(dir, sign).then(res => {
			var url = ypHost + dir
			resolve(res? url: res)
		})
	})
}