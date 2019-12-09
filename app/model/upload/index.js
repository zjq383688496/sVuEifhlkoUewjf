const ffprobe = require('../../ffprobe')
const ffmpeg  = require('../../ffmpeg')
const fs = require('fs')
const { tmp, upyunDir, ypHost } = require('../../config')
const { upyun, setProgress } = require('../../utils')

const { round } = Math

module.exports = async function(ctx, next) {
	let { headers, request: { body, files: { file } } } = ctx,
		{ name, hash, path, type } = file,
		[ _type ] = type.split('/'),
		ext = getFileExt(name),
		filename  = `${hash}${ext? '.' + ext: ''}`,
		url = ''

	setProgress(0, '检测开始...')

	if (_type === 'video') {
		filename  = `${hash}.mp4`
		let localFile = `${tmp}/${filename}`
		let info = await ffprobe(path)	// 获取文件信息
		setProgress(10, '检测完成. [视频]')
		setProgress(10, '开始编码...')
		await ffmpeg(info, { ...body, filename: localFile, _path: path })
		setProgress(70, '编码完成.')
		setProgress(70, '上传开始...')
		url = await upyunUpload(localFile, filename)
	} else {
		setProgress(70, '检测完成. [其他]')
		url = await upyunUpload(path, filename)
	}

	setProgress(100, '上传完成.')

	ctx.body = { url }
}

// 上传文件
function upyunUpload(localFile, filename) {
	return new Promise(async (resolve, reject) => {
		var _stat    = await fs.statSync(localFile),
			{ size } = _stat,
			_stream  = fs.createReadStream(localFile),
			dir  = `${upyunDir}/${filename}`,
			byte = 0
		var __stream = upyun.putFile(dir, _stream).then(res => {
			var url = ypHost + dir
			resolve(res? url: res)
		})

		_stream.on('data', chunk => {
			byte += chunk.length
			var progress = round(70 + 29 * byte / size)
			setProgress(progress)
		})

		// _stream.on('end', chunk => {
		// 	console.log('读取完成')
		// })
	})
}

// 获取文件后缀名
function getFileExt(name) {
	var mt = name.match(/\.(\S+)$/)
	return mt? mt[1]: ''
}